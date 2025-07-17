import { NextApiRequest, NextApiResponse } from 'next';
import { generateContentWithTiming } from '@/lib/gemini';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { passage, question, questionType, correctAnswer, userAnswer, options } = req.body;

    if (!passage || !question || !correctAnswer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('📤 Gửi yêu cầu giải thích tới Gemini API với Streaming');
    console.log('🌏 Region: asia-southeast1 (Singapore) - Tối ưu tốc độ');

    // Tạo prompt chi tiết cho Gemini
    const prompt = `
Bạn là một giáo viên IELTS chuyên nghiệp. Hãy giải thích chi tiết câu hỏi IELTS Reading sau đây:

**Bài đọc:**
${passage}

**Câu hỏi:**
${question}

**Loại câu hỏi:** ${questionType}

**Đáp án đúng:** ${correctAnswer}

**Đáp án của học sinh:** ${userAnswer || 'Không trả lời'}

${options && options.length > 0 ? `**Các lựa chọn:**\n${options.map((opt: string, idx: number) => `${idx + 1}. ${opt}`).join('\n')}` : ''}

Hãy cung cấp giải thích chi tiết bao gồm:

1. **Phân tích câu hỏi:** Giải thích câu hỏi đang hỏi gì và cách tiếp cận
2. **Tìm thông tin trong bài đọc:** Chỉ ra đoạn văn nào chứa thông tin liên quan
3. **Lý do đáp án đúng:** Giải thích tại sao ${correctAnswer} là đáp án đúng
4. **Phân tích lỗi (nếu có):** Nếu học sinh trả lời sai, giải thích tại sao đáp án đó không đúng
5. **Mẹo làm bài:** Đưa ra lời khuyên để tránh lỗi tương tự trong tương lai
6. **Từ vựng quan trọng:** Liệt kê các từ khóa và từ vựng quan trọng trong câu hỏi và đoạn văn liên quan

Hãy viết giải thích bằng tiếng Việt, rõ ràng và dễ hiểu.
`;

    try {
      // Sử dụng streaming API để tăng tốc độ phản hồi
      const result = await generateContentWithTiming(prompt, 'gemini-1.5-flash', true);
      console.log(`⚡ Thời gian phản hồi streaming: ${result.duration}ms`);
      
      res.status(200).json({ explanation: result.text });
    } catch (streamingError) {
      console.error('❌ Lỗi streaming API:', streamingError);
      console.log('🔄 Fallback to standard API...');
      
      try {
        // Fallback to standard API
        const fallbackResult = await generateContentWithTiming(prompt, 'gemini-1.5-flash', false);
        console.log(`⚡ Thời gian phản hồi fallback: ${fallbackResult.duration}ms`);
        
        res.status(200).json({ explanation: fallbackResult.text });
      } catch (fallbackError) {
        console.error('❌ Cả streaming và fallback đều thất bại:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}