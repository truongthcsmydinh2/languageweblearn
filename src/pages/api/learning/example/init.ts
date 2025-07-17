import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';
import { generateContentWithTiming, generateJSONContent } from '@/lib/gemini';

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Lấy số lượng từ vựng từ query params, mặc định là 10
  const count = parseInt(req.query.count as string || '10', 10);
  // Lấy danh sách từ vựng cụ thể nếu có
  const words = req.query.words ? (req.query.words as string).split(',') : [];

  try {
    let termsQuery: string;
    let params: any[];

    if (words.length > 0) {
      // Nếu có danh sách từ vựng cụ thể
      const wordIds = words.map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));

      if (wordIds.length > 0) {
        if (wordIds.length === 1) {
          // Trường hợp chỉ có một ID, sử dụng raw query để tránh lỗi prepared statement
          termsQuery = `
            SELECT id, vocab as word, meanings 
            FROM terms 
            WHERE firebase_uid = '${firebase_uid}' AND id = ${wordIds[0]}
            LIMIT ${count}
          `;
          params = [];

        } else {
          // Trường hợp có nhiều ID, sử dụng raw query để tránh lỗi prepared statement
          const placeholders = wordIds.join(',');
          termsQuery = `
            SELECT id, vocab as word, meanings 
            FROM terms 
            WHERE firebase_uid = '${firebase_uid}' AND id IN (${placeholders})
            ORDER BY FIELD(id, ${placeholders})
            LIMIT ${count}
          `;
          params = [];
        }
      } else {
        // Fallback to random if all word IDs are invalid - sử dụng raw query
        termsQuery = `
          SELECT id, vocab as word, meanings 
          FROM terms 
          WHERE firebase_uid = '${firebase_uid}' 
          ORDER BY RAND() 
          LIMIT ${count}
        `;
        params = [];
      }
    } else {
      // Nếu không có danh sách từ vựng cụ thể, lấy ngẫu nhiên - sử dụng raw query
      termsQuery = `
        SELECT id, vocab as word, meanings 
        FROM terms 
        WHERE firebase_uid = '${firebase_uid}' 
        ORDER BY RAND() 
        LIMIT ${count}
      `;
      params = [];
    }


    
    // Sử dụng query cho raw SQL hoặc execute cho prepared statement
    const [terms] = params.length === 0 ? await db.query(termsQuery) : await db.execute(termsQuery, params);

    if (!terms || (terms as any[]).length === 0) {
      return res.status(200).json({ words: [] });
    }

    // Xử lý dữ liệu từ vựng
    const processedWords: Word[] = (terms as any[]).map(term => {
      let meanings = [];
      try {
        if (term.meanings) {
          if (typeof term.meanings === 'string') {
            meanings = JSON.parse(term.meanings);
          } else {
            meanings = term.meanings;
          }
        }
        if (!Array.isArray(meanings)) meanings = [];
      } catch (e) {
        meanings = [];
      }

      // Lấy nghĩa tiếng Việt đầu tiên
      const meaning = meanings.length > 0 ? meanings[0] : '';

      return {
        id: term.id,
        word: term.word,
        meaning,
        example: '' // Sẽ được điền bởi Gemini API
      };
    });

    // Tạo câu ví dụ cho từng từ bằng Gemini API
    const wordsWithExamples = await generateExamples(processedWords);

    return res.status(200).json({ words: wordsWithExamples });
  } catch (error) {
    console.error('Error in example learning init:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateExamples(words: Word[]): Promise<Word[]> {
  interface Example {
    word: string;
    example: string;
  }
  try {
    // Tạo danh sách từ vựng để gửi đến Gemini API
    const wordsList = words.map(word => `${word.word} (${word.meaning})`).join('\n');

    // Tạo prompt cho Gemini API
    const prompt = `
Bạn là một giáo viên tiếng Anh chuyên nghiệp. Hãy tạo các câu ví dụ bằng tiếng Việt cho danh sách từ vựng tiếng Anh sau đây. Mỗi câu ví dụ phải sử dụng từ vựng một cách tự nhiên và đúng ngữ cảnh.

Danh sách từ vựng:
${wordsList}

Yêu cầu:
1. Tạo một câu ví dụ bằng tiếng Việt cho mỗi từ.
2. Câu ví dụ phải ngắn gọn, dễ hiểu và phù hợp với ngữ cảnh sử dụng thông thường của từ.
3. Câu ví dụ nên có độ dài vừa phải (10-15 từ).
4. Đảm bảo câu ví dụ thể hiện đúng nghĩa và cách sử dụng của từ.

Trả về kết quả dưới dạng JSON với cấu trúc sau:
{
  "examples": [
    {
      "word": "từ tiếng Anh",
      "meaning": "nghĩa tiếng Việt",
      "example": "câu ví dụ tiếng Việt"
    }
  ]
}
`;

    console.log('📤 Gửi yêu cầu tạo ví dụ tới Gemini API với Streaming');
    console.log('🌏 Region: asia-southeast1 (Singapore) - Tối ưu tốc độ');
    
    let examples: Example[] = [];
    
    try {
      // Sử dụng streaming API để tăng tốc độ phản hồi
      const result = await generateJSONContent(prompt, 'gemini-1.5-flash');
      console.log(`⚡ Thời gian phản hồi streaming: ${Date.now() - Date.now()}ms`);
      
      if (result && result.examples && Array.isArray(result.examples)) {
        examples = result.examples;
        console.log(`✅ Parsed ${examples.length} examples từ streaming response`);
      } else {
        console.warn('⚠️ Streaming response không có format mong đợi, thử parse thủ công');
        // Fallback parsing logic sẽ được xử lý bên dưới
      }

      // Nếu streaming thành công và có examples, sử dụng kết quả đó
      if (examples.length === 0) {
        console.log('🔄 Thử parse từ raw streaming response...');
        // Logic fallback parsing có thể được thêm vào đây nếu cần
      }
      
    } catch (streamingError) {
      console.error('❌ Lỗi streaming API:', streamingError);
      console.log('🔄 Fallback to standard API...');
      
      try {
        // Fallback to standard API
        const fallbackResult = await generateContentWithTiming(prompt, 'gemini-1.5-flash', false);
        console.log(`⚡ Thời gian phản hồi fallback: ${fallbackResult.duration}ms`);
        
        try {
          // Tìm và parse JSON trong text
          let jsonMatch = fallbackResult.text.match(/\{[\s\S]*\}/);
          let jsonText = jsonMatch ? jsonMatch[0] : fallbackResult.text;
          
          // Loại bỏ markdown trước khi parse
          jsonText = jsonText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```\s*$/i, '')
            .trim();
          
          const parsed = JSON.parse(jsonText);
          
          if (parsed.examples && Array.isArray(parsed.examples)) {
            examples = parsed.examples;
            console.log(`✅ Parsed ${examples.length} examples từ fallback`);
          } else {
            console.warn('⚠️ Fallback response không có format mong đợi');
            console.log('📄 Parsed data:', parsed);
          }
        } catch (parseError) {
          console.error('❌ Lỗi parse JSON fallback:', parseError);
          console.log('📄 Raw text:', fallbackResult.text);
          // Trả về danh sách từ vựng ban đầu nếu có lỗi parse
          return words;
        }
        
      } catch (fallbackError) {
        console.error('❌ Cả streaming và fallback đều thất bại:', fallbackError);
        // Trả về danh sách từ vựng ban đầu nếu có lỗi
        return words;
      }
    }

    // Kết hợp ví dụ với danh sách từ vựng ban đầu
    const wordsWithExamples = words.map(word => {
      const matchingExample = examples.find((ex: Example) => ex.word === word.word);
      return {
        ...word,
        example: matchingExample ? matchingExample.example : ''
      };
    });

    return wordsWithExamples;
  } catch (error) {
    console.error('Error generating examples:', error);
    return words;
  }
}