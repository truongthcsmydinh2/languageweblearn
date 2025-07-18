import type { NextApiRequest, NextApiResponse } from 'next';
import { generateContentWithTiming, generateJSONContent } from '@/lib/gemini';
import { safeJsonParse } from '@/utils/jsonUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userAnswer, originalSentence } = req.body;

  if (!userAnswer || !originalSentence) {
    return res.status(400).json({ error: 'Thiếu dữ liệu cần thiết' });
  }

  try {
    // Tạo prompt đơn giản để test
    const prompt = `
Bạn là một giáo viên tiếng Anh. Hãy đánh giá bản dịch tiếng Anh của học sinh.

Câu gốc (tiếng Việt): "${originalSentence}"
Bản dịch của học sinh (tiếng Anh): "${userAnswer}"

Hãy trả về kết quả theo định dạng JSON sau:
{
  "score": số điểm từ 1-10,
  "feedback": "nhận xét tổng quan",
  "errors": ["danh sách lỗi cụ thể"],
  "suggestions": ["gợi ý sửa lỗi"],
  "corrected_version": "bản dịch đúng hoặc gợi ý",
  "advice": "lời khuyên để cải thiện"
}
`;

    console.log('📤 Gửi yêu cầu đánh giá tới Gemini API với Streaming');
    console.log('🌏 Region: asia-southeast1 (Singapore) - Tối ưu tốc độ');
    
    try {
      // Sử dụng streaming API để tăng tốc độ phản hồi
      const result = await generateJSONContent(prompt, 'gemini-1.5-flash');
      console.log(`⚡ Thời gian phản hồi streaming: ${Date.now() - Date.now()}ms`);
      
      let evaluation = null;
      
      if (result && typeof result === 'object') {
        evaluation = result;
        console.log('✅ Parsed evaluation từ streaming response');
      } else {
        console.warn('⚠️ Streaming response không có format mong đợi, thử parse thủ công');
        // Fallback parsing logic sẽ được xử lý bên dưới
      }
      
    } catch (streamingError) {
      console.error('❌ Lỗi streaming API:', streamingError);
      console.log('🔄 Fallback to standard API...');
      
      try {
        // Fallback to standard API
        const fallbackResult = await generateContentWithTiming(prompt, 'gemini-1.5-flash', false);
        console.log(`⚡ Thời gian phản hồi fallback: ${fallbackResult.duration}ms`);
        
        // Tìm và parse JSON trong text
        let jsonMatch = fallbackResult.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          evaluation = safeJsonParse(jsonMatch[0]);
          if (evaluation) {
            console.log('✅ Parsed evaluation từ fallback:', evaluation);
          } else {
            // Fallback nếu không parse được JSON
            evaluation = {
              score: 5,
              feedback: fallbackResult.text || 'Không thể đánh giá',
              errors: ['Không thể phân tích chi tiết'],
              suggestions: ['Hãy thử lại'],
              corrected_version: '',
              advice: 'Hãy kiểm tra lại ngữ pháp và từ vựng'
            };
          }
        } else {
          console.warn('❌ Không tìm thấy JSON hợp lệ trong fallback response');
          evaluation = {
            score: 5,
            feedback: fallbackResult.text || 'Không thể đánh giá',
            errors: ['Lỗi phân tích phản hồi'],
            suggestions: ['Hãy thử lại'],
            corrected_version: '',
            advice: 'Hãy kiểm tra lại ngữ pháp và từ vựng'
          };
        }
        
      } catch (fallbackError) {
        console.error('❌ Cả streaming và fallback đều thất bại:', fallbackError);
        evaluation = {
          score: 5,
          feedback: 'Không thể đánh giá do lỗi hệ thống',
          errors: ['Lỗi kết nối API'],
          suggestions: ['Hãy thử lại sau'],
          corrected_version: '',
          advice: 'Hãy kiểm tra kết nối mạng và thử lại'
        };
      }
    }
    
    // Sử dụng evaluation từ streaming hoặc fallback
    if (!evaluation) {
      // Default fallback nếu cả hai đều thất bại
      evaluation = {
        score: 5,
        feedback: 'Không thể đánh giá câu trả lời này',
        errors: ['Lỗi hệ thống'],
        suggestions: ['Hãy thử lại'],
        corrected_version: originalSentence,
        advice: 'Hãy kiểm tra kết nối và thử lại'
      };
    }

    return res.status(200).json({
      success: true,
      ...evaluation
    });

  } catch (error) {
    console.error('Error testing Gemini:', error);
    return res.status(500).json({ 
      error: 'Lỗi server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}