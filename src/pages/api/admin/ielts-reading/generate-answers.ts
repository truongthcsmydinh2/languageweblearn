import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { generateContentWithTiming, generateJSONContent } from '@/lib/gemini';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const firebase_uid = req.headers.firebase_uid as string;
  
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user is admin
  const user = await prisma.users.findFirst({
    where: { firebase_uid }
  });

  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    try {
      const { content, passage_title, raw_answers } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Thiếu nội dung bài đọc' });
      }

      if (!raw_answers) {
        return res.status(400).json({ error: 'Thiếu đáp án thô' });
      }

      // Tạo prompt cho Gemini để biên dịch và sắp xếp đáp án
      const prompt = `
Bạn là một giáo viên IELTS chuyên nghiệp. Đây là đáp án thô chưa được biên dịch và sắp xếp, nhiệm vụ của bạn là biên dịch sang tiếng Anh và sắp xếp theo thứ tự.

**Tiêu đề bài đọc**: ${passage_title || 'IELTS Reading Passage'}

**Nội dung bài đọc**:
${content}

**Đáp án thô (cần biên dịch và sắp xếp)**:
${raw_answers}

**Yêu cầu**:
1. Biên dịch đáp án sang tiếng Anh (nếu đang bằng tiếng Việt)
2. Sắp xếp đáp án theo thứ tự logic
3. Định dạng đáp án cho đúng chuẩn IELTS
4. Trả về kết quả dưới dạng JSON array

**Định dạng JSON trả về**:
[
  {
    "question_number": "1",
    "answer": "Đáp án đã biên dịch",
    "explanation": "Giải thích (tùy chọn)",
    "order_index": 1
  }
]

**Lưu ý**: 
- Tất cả đáp án phải bằng tiếng Anh
- Đáp án phải phù hợp với độ khó IELTS (B1-C1)
- Sắp xếp theo thứ tự logic và dễ hiểu
- Đảm bảo đáp án chính xác dựa trên nội dung bài đọc
`;

      console.log('📤 Gửi yêu cầu biên dịch đáp án tới Gemini API với Streaming');
      console.log('🌏 Region: asia-southeast1 (Singapore) - Tối ưu tốc độ');
      
      let answersText = '';
      
      try {
        // Sử dụng streaming API để tăng tốc độ phản hồi
        const result = await generateContentWithTiming(prompt, 'gemini-1.5-flash', true);
        console.log(`⚡ Thời gian phản hồi streaming: ${result.duration}ms`);
        
        answersText = result.text;
        console.log('✅ Received response từ streaming API');
        console.log('📝 Extracted text:', answersText.substring(0, 200) + '...');
        
      } catch (streamingError) {
        console.error('❌ Lỗi streaming API:', streamingError);
        console.log('🔄 Fallback to standard API...');
        
        try {
          // Fallback to standard API
          const fallbackResult = await generateContentWithTiming(prompt, 'gemini-1.5-flash', false);
          console.log(`⚡ Thời gian phản hồi fallback: ${fallbackResult.duration}ms`);
          
          answersText = fallbackResult.text;
          console.log('✅ Received response từ fallback API');
          console.log('📝 Extracted text:', answersText.substring(0, 200) + '...');
          
        } catch (fallbackError) {
          console.error('❌ Cả streaming và fallback đều thất bại:', fallbackError);
          return res.status(500).json({ error: 'Lỗi Gemini API', detail: String(fallbackError) });
        }
      }

      if (!answersText) {
        console.error('❌ Không tìm thấy text trong response');
        return res.status(500).json({ error: 'Gemini không trả về đáp án' });
      }

      // Parse JSON từ response
      let answers = [];
      try {
        // Loại bỏ backticks và code blocks
        let cleanText = answersText;
        
        // Loại bỏ ```json và ``` nếu có
        cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Kiểm tra xem JSON có bị cắt ngắn không
        const openBrackets = (cleanText.match(/\[/g) || []).length;
        const closeBrackets = (cleanText.match(/\]/g) || []).length;
        
        if (openBrackets > closeBrackets) {
          // JSON bị cắt ngắn, thêm dấu đóng ngoặc
          cleanText = cleanText.trim() + ']';
        }
        
        // Tìm JSON array trong text
        const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            answers = JSON.parse(jsonMatch[0]);
          } catch (e) {
            // Thử parse toàn bộ text nếu JSON array không hợp lệ
            answers = JSON.parse(cleanText);
          }
        } else {
          // Fallback: thử parse toàn bộ text
          answers = JSON.parse(cleanText);
        }
        
        // Đảm bảo answers là array
        if (!Array.isArray(answers)) {
          throw new Error('Response không phải array');
        }
        
        // Validate và format answers
        answers = answers.map((a: any, index: number) => ({
          question_number: a.question_number || `Câu ${index + 1}`,
          answer: a.answer || '',
          explanation: a.explanation || '',
          order_index: index + 1
        })).filter((a: any) => a.answer);
        
        console.log('✅ Parsed answers:', answers.length);
        
      } catch (parseError) {
        console.error('❌ Lỗi parse JSON answers:', parseError);
        console.error('❌ Raw text:', answersText);
        
        // Thử parse từng phần nếu toàn bộ JSON không hợp lệ
        try {
          const lines = answersText.split('\n');
          const answerLines = lines.filter(line => 
            line.includes('"question_number"') || 
            line.includes('"answer"') ||
            line.includes('"explanation"')
          );
          
          if (answerLines.length > 0) {
            // Tạo JSON array từ các dòng hợp lệ
            const partialJson = '[' + answerLines.join(',') + ']';
            answers = JSON.parse(partialJson);
            
            // Validate và format answers
            answers = answers.map((a: any, index: number) => ({
              question_number: a.question_number || `Câu ${index + 1}`,
              answer: a.answer || '',
              explanation: a.explanation || '',
              order_index: index + 1
            })).filter((a: any) => a.answer);
            
            console.log('✅ Parsed partial answers:', answers.length);
          } else {
            throw new Error('Không thể parse được đáp án');
          }
        } catch (fallbackError) {
          return res.status(500).json({ 
            error: 'Lỗi parse JSON đáp án từ Gemini', 
            detail: answersText.substring(0, 500) + '...' 
          });
        }
      }

      return res.status(200).json({
        success: true,
        answers: answers,
        rawResponse: answersText
      });

    } catch (error) {
      console.error('❌ Lỗi khi biên dịch đáp án với Gemini:', error);
      return res.status(500).json({ 
        error: 'Lỗi server',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}