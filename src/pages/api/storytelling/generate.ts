import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/mysql';
import { v4 as uuidv4 } from 'uuid';

interface Term {
  id: number;
  vocab: string;
  meaning: string;
  part_of_speech: string;
}

interface StoryTerm {
  id: string;
  vocabId: number;
  context: string;
  contextual_meaning: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { termCount = 5, userId, selectedTerms } = req.body;

    // Kiểm tra cấu trúc bảng stories và story_terms
    console.log('Checking table structures...');
    const [storiesStructure] = await db.execute('DESCRIBE stories');
    const [storyTermsStructure] = await db.execute('DESCRIBE story_terms');
    console.log('Stories table structure:', storiesStructure);
    console.log('Story_terms table structure:', storyTermsStructure);

    // Lấy danh sách từ vựng
    let terms: Term[];
    if (selectedTerms && selectedTerms.length > 0) {
      // Nếu người dùng chọn từ cụ thể
      const placeholders = selectedTerms.map(() => '?').join(',');
      const [selectedTermsResult] = await db.execute(
        `SELECT id, vocab, meaning, part_of_speech 
         FROM terms 
         WHERE id IN (${placeholders})
         AND firebase_uid = ?`,
        [...selectedTerms, userId || null]
      ) as [Term[], any];
      terms = selectedTermsResult;
    } else {
      // Nếu không chọn từ cụ thể, lấy ngẫu nhiên
      const [randomTerms] = await db.execute(
        `SELECT id, vocab, meaning, part_of_speech 
         FROM terms 
         WHERE firebase_uid = ? 
         ORDER BY RAND() 
         LIMIT ?`,
        [userId || null, termCount]
      ) as [Term[], any];
      terms = randomTerms;
    }

    if (!terms.length) {
      return res.status(404).json({ message: 'Không tìm thấy từ vựng' });
    }

    // Initialize the Google AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Tạo prompt cho AI
    const wordsWithMeanings = terms.map((term: Term) => 
      `${term.vocab} (${term.part_of_speech}): ${term.meaning}`
    ).join('\n- ');

    const prompt = `
    Tạo một đoạn văn bản bằng tiếng Việt tự nhiên có chèn các từ tiếng Anh sau:
    - ${wordsWithMeanings}
    
    Yêu cầu:
    1. Đoạn văn dài khoảng 150-200 từ
    2. Sử dụng tất cả các từ tiếng Anh trong danh sách
    3. Đặt các từ tiếng Anh trong ngoặc đơn, ví dụ: (diploma)
    4. Với mỗi từ tiếng Anh, ngay sau khi sử dụng từ đó, hãy thêm nghĩa tiếng Việt và gạch chân bằng cách đặt trong dấu "__", 
       ví dụ: (diploma) __bằng tốt nghiệp__
       Lưu ý: Phần nghĩa này sẽ được sử dụng làm đáp án khi người dùng học từ vựng
    5. Đoạn văn phải tự nhiên, mạch lạc và thú vị
    6. Sử dụng từ tiếng Anh đúng với ngữ cảnh
    7. Đảm bảo phần nghĩa đặt trong dấu "__" phù hợp với ngữ cảnh của câu, có thể khác với nghĩa gốc ở danh sách
    
    Ví dụ:
    "Sau khi nhận được (diploma) __bằng tốt nghiệp__, tôi tìm thấy (inspiration) __nguồn cảm hứng__ để bắt đầu khởi nghiệp."

    Kết quả trả về chỉ gồm đoạn văn, không bao gồm giải thích hoặc danh sách từ.
    `;

    // Generate the story
    const result = await model.generateContent(prompt);
    const storyContent = result.response.text();

    // Tạo UUID cho story mới
    const storyId = uuidv4();

    // Tạo story mới trong database
    await db.execute(
      `INSERT INTO stories (id, content) VALUES (?, ?)`,
      [storyId, storyContent]
    );

    // Thêm các từ vựng vào story_terms
    for (const term of terms) {
      // Tìm context cho từng từ vựng trong câu chuyện
      // Sử dụng regex để tìm cấu trúc (word) __meaning__
      const contextualTermRegex = new RegExp(`\\(${term.vocab}\\)\\s*__([^_]+)__`, 'i');
      const contextMatch = storyContent.match(contextualTermRegex);
      
      if (contextMatch && contextMatch[1]) {
        // Tìm thấy nghĩa ngữ cảnh từ mẫu (word) __meaning__
        const contextualMeaning = contextMatch[1].trim();
        
        // Lấy context xung quanh từ vựng (khoảng 200 ký tự)
        const start = Math.max(0, contextMatch.index! - 100);
        const end = Math.min(storyContent.length, contextMatch.index! + contextMatch[0].length + 100);
        const context = storyContent.substring(start, end);
        
        // Lưu vào database
        await db.execute(
          `INSERT INTO story_terms (storyId, vocabId, context, contextual_meaning) VALUES (?, ?, ?, ?)`,
          [storyId, term.id, context, contextualMeaning]
        );
      } else {
        // Không tìm thấy định dạng (word) __meaning__, thử tìm từ tiếng Anh đơn thuần
        const simpleRegex = new RegExp(`\\b${term.vocab}\\b`, 'gi');
        const matches = [...storyContent.matchAll(simpleRegex)];
        
        if (matches.length > 0) {
          // Lấy context xung quanh từ vựng (khoảng 100 ký tự)
          const match = matches[0];
          const start = Math.max(0, match.index! - 50);
          const end = Math.min(storyContent.length, match.index! + term.vocab.length + 50);
          const context = storyContent.substring(start, end);
          
          await db.execute(
            `INSERT INTO story_terms (storyId, vocabId, context, contextual_meaning) VALUES (?, ?, ?, ?)`,
            [storyId, term.id, context, term.meaning]
          );
        } else {
          // Nếu không tìm thấy từ vựng trong câu chuyện, lưu toàn bộ nội dung
          await db.execute(
            `INSERT INTO story_terms (storyId, vocabId, context, contextual_meaning) VALUES (?, ?, ?, ?)`,
            [storyId, term.id, storyContent, term.meaning]
          );
        }
      }
    }

    // Trích xuất tất cả từ vựng từ câu chuyện dưới định dạng (word) __meaning__
    const allTermsRegex = /\(([^)]+)\)\s*__([^_]+)__/g;
    const extractedTerms: StoryTerm[] = [];
    let match;
    
    while ((match = allTermsRegex.exec(storyContent)) !== null) {
      const vocab = match[1].trim();
      const meaning = match[2].trim();
      
      // Tìm term tương ứng trong danh sách từ vựng
      const matchedTerm = terms.find(t => t.vocab.toLowerCase() === vocab.toLowerCase());
      
      if (matchedTerm) {
        extractedTerms.push({
          id: String(matchedTerm.id),
          vocabId: matchedTerm.id,
          context: vocab,
          contextual_meaning: meaning
        });
      } else {
        // Trường hợp không tìm thấy từ trong danh sách ban đầu
        // Có thể là do AI đã thay đổi từ hoặc thêm từ mới
        extractedTerms.push({
          id: `new-${extractedTerms.length}`,
          vocabId: -1, // Giá trị tạm thời, không có trong database
          context: vocab,
          contextual_meaning: meaning
        });
      }
    }
    
    // Nếu không tìm được term nào từ câu chuyện, sử dụng danh sách terms ban đầu
    const storyTerms: StoryTerm[] = extractedTerms.length > 0 
      ? extractedTerms 
      : terms.map(term => ({
          id: String(term.id),
          vocabId: term.id,
          context: term.vocab,
          contextual_meaning: term.meaning
        }));

    return res.status(200).json({
      story: {
        id: storyId,
        content: storyContent,
        terms: storyTerms
      }
    });
  } catch (error: any) {
    console.error('Error generating story:', error);
    return res.status(500).json({ message: 'Lỗi khi tạo chuyện chêm', error: error.message });
  }
} 