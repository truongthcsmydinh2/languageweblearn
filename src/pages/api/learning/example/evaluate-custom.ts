import type { NextApiRequest, NextApiResponse } from 'next';
import { generateContentWithTiming, generateJSONContent } from '@/lib/gemini';

interface EvaluationResult {
  score: number;
  feedback: string;
  errors: string[];
  suggestions: string[];
  examples: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { word, meaning, userAnswer } = req.body;
    
    if (!word || !meaning || !userAnswer) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    console.log('📥 Request payload:', { word, meaning, userAnswer });
    
    // Tạo prompt cho Gemini API
    const prompt = `
You are a teacher grade and give detail feedback for student
Vocab: ${word}
Meaning: ${meaning}
Userinput: ${userAnswer}

Requirement:
1. Anser with Vietnamese
1. Grade userinput 100 scale.
2. Check grammar and accuracy.
3. Check context.
4. Highlight error.
5. Suggest improvement.
6. Provide example.

Return result as JSON with structure:
{
  "score": number (0-100),
  "feedback": "detail feedback in Vietnamese",
  "errors": ["error 1", "error 2", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "examples": ["example 1", "example 2", ...]
}
`;

    console.log('📤 Gửi yêu cầu đánh giá tới Gemini API với Streaming');
    console.log('🌏 Region: asia-southeast1 (Singapore) - Tối ưu tốc độ');
    
    let evaluationResult: EvaluationResult;
    
    try {
      // Sử dụng streaming API để tăng tốc độ phản hồi
      const result = await generateJSONContent(prompt, 'gemini-1.5-flash');
      console.log(`⚡ Thời gian phản hồi streaming: ${Date.now() - Date.now()}ms`);
      
      if (result && typeof result === 'object') {
        evaluationResult = result as EvaluationResult;
        console.log('✅ Parsed evaluation result từ streaming response');
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
          
          evaluationResult = JSON.parse(jsonText);
          console.log('✅ Parsed evaluation result từ fallback:', evaluationResult);
        } catch (parseError) {
          console.error('❌ Lỗi parse JSON fallback:', parseError);
          return res.status(500).json({ error: 'Error parsing Gemini response' });
        }
        
      } catch (fallbackError) {
        console.error('❌ Cả streaming và fallback đều thất bại:', fallbackError);
        return res.status(500).json({ error: 'Gemini API error', detail: String(fallbackError) });
      }
    }

    // Kiểm tra và đảm bảo các trường đúng kiểu
    if (!evaluationResult.score || isNaN(evaluationResult.score)) evaluationResult.score = 50;
    if (!evaluationResult.feedback || typeof evaluationResult.feedback !== 'string') evaluationResult.feedback = '';
    if (!Array.isArray(evaluationResult.errors)) evaluationResult.errors = [];
    if (!Array.isArray(evaluationResult.suggestions)) evaluationResult.suggestions = [];
    if (!Array.isArray(evaluationResult.examples)) evaluationResult.examples = [];
    
    // Lưu kết quả đánh giá vào cơ sở dữ liệu (nếu cần)
    // TODO: Implement this if needed

    // Ensure evaluationResult is defined before returning
    if (!evaluationResult) {
      return res.status(500).json({ error: 'Failed to generate evaluation result' });
    }
    return res.status(200).json(evaluationResult);
  } catch (error) {
    console.error('❌ Error in custom sentence evaluation:', error);
    return res.status(500).json({ error: 'Internal server error', detail: String(error) });
  }
}