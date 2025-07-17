import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateContentWithTiming, generateJSONContent } from '@/lib/gemini';

interface GeminiResponse {
  accuracy: number;
  feedback: string;
  errors: string[];
  suggestions: string[];
  corrected_version: string;
  advice: string;
  vocabulary_analysis: {
    word: string;
    current_band: string;
    suggested_alternatives: {
      word: string;
      band: string;
    }[];
  }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lessonId, sentenceId, userAnswer, originalSentence, answerKey, lessonType, lessonLevel } = req.body;
    
    console.log('📥 Request payload:', { lessonId, sentenceId, userAnswer, originalSentence, lessonType, lessonLevel });
    
    if (!lessonId || !userAnswer || !originalSentence) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra lessonId và sentenceId có tồn tại không
    try {
      const lesson = await prisma.writingLesson.findUnique({ where: { id: lessonId } });
      if (!lesson) {
        return res.status(400).json({ error: `LessonId ${lessonId} không tồn tại` });
      }
      
      if (sentenceId) {
        const sentence = await prisma.writingSentence.findFirst({ 
          where: { id: sentenceId, lesson_id: lessonId } 
        });
        if (!sentence) {
          return res.status(400).json({ error: `SentenceId ${sentenceId} không thuộc về lessonId ${lessonId}` });
        }
      }
    } catch (checkError) {
      console.error('Lỗi kiểm tra lesson/sentence:', checkError);
    }

    console.log('✅ Đã kiểm tra lessonId và sentenceId hợp lệ');
    
    const submission = await prisma.writing_submissions.create({
      data: {
        lesson_id: lessonId,
        sentence_id: sentenceId || null,
        user_answer: userAnswer,
        original_sentence: originalSentence,
        score: 0,
        feedback: '',
        errors: '[]',
        suggestions: '[]',
        corrected_version: '',
        advice: ''
      }
    });

    console.log('✅ Đã tạo submission record:', submission.id);

    const prompt = `
Đánh giá bản dịch tiếng Anh của học sinh.
Thông tin:
- Loại bài: ${lessonType}
- Độ khó: ${lessonLevel}
- Câu gốc: "${originalSentence}"
- Bản dịch học sinh: "${userAnswer}"
${answerKey ? `- Đáp án chuẩn: "${answerKey}"` : ''}
Yêu cầu: Trả về kết quả dưới dạng JSON object với các trường: accuracy (số từ 0-100), feedback (string bằng tiếng Việt), errors (array of string bằng tiếng Việt), suggestions (array of string bằng tiếng Việt), corrected_version (string), advice (string bằng tiếng Việt), vocabulary_analysis (array of objects).

Trường vocabulary_analysis là một mảng các đối tượng, mỗi đối tượng có cấu trúc:
{
  "word": "từ được phân tích",
  "current_band": "band hiện tại của từ (A1, A2, B1, B2, C1, C2)",
  "suggested_alternatives": [
    {
      "word": "từ thay thế cao cấp hơn",
      "band": "band của từ thay thế"
    }
  ]
}

Hãy phân tích 3-5 từ quan trọng trong câu trả lời của học sinh, chỉ ra band hiện tại của từ đó (theo CEFR: A1, A2, B1, B2, C1, C2) và gợi ý 1-3 từ thay thế ở band cao hơn (nếu có thể).

Lưu ý: Tất cả các giải thích, đánh giá và gợi ý phải được viết bằng tiếng Việt.`;

    console.log('📤 Gửi yêu cầu đánh giá tới Gemini API với Streaming');
    console.log('🌏 Region: asia-southeast1 (Singapore) - Tối ưu tốc độ');
    
    try {
      // Sử dụng streaming API để tăng tốc độ phản hồi
      const result = await generateJSONContent(prompt, 'gemini-1.5-flash');
      console.log(`⚡ Thời gian phản hồi streaming: ${Date.now() - Date.now()}ms`);
      
      let geminiResponse = null;
      
      if (result && typeof result === 'object') {
        geminiResponse = result;
        console.log('✅ Parsed response từ streaming');
      } else {
        console.warn('⚠️ Streaming response không có format mong đợi, thử parse thủ công');
        // Fallback parsing logic sẽ được xử lý bên dưới
      }

      // Nếu streaming thành công và có geminiResponse, sử dụng kết quả đó
      if (!geminiResponse) {
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
          
          geminiResponse = JSON.parse(jsonText);
          console.log('✅ Parsed response từ fallback:', geminiResponse);
        } catch (parseError) {
          console.error('❌ Lỗi parse JSON fallback:', parseError);
          console.log('📄 Raw text:', fallbackResult.text);
          return res.status(500).json({ error: 'Lỗi parse response từ Gemini' });
        }
        
      } catch (fallbackError) {
        console.error('❌ Cả streaming và fallback đều thất bại:', fallbackError);
        return res.status(500).json({ error: 'Lỗi khi gọi Gemini API' });
      }
    }
    
    // Sử dụng geminiResponse từ streaming hoặc fallback
    let feedback: GeminiResponse;
    if (geminiResponse) {
      feedback = geminiResponse as GeminiResponse;
    } else {
      // Default fallback nếu cả hai đều thất bại
      feedback = {
        accuracy: 50,
        feedback: 'Không thể đánh giá bài viết này',
        errors: [],
        suggestions: [],
        corrected_version: userAnswer,
        advice: 'Vui lòng thử lại sau',
        vocabulary_analysis: []
      };
    }

    // Kiểm tra và đảm bảo các trường đúng kiểu
    if (!feedback.accuracy || isNaN(feedback.accuracy)) feedback.accuracy = 50;
    if (!feedback.feedback || typeof feedback.feedback !== 'string') feedback.feedback = '';
    if (!Array.isArray(feedback.errors)) feedback.errors = [];
    if (!Array.isArray(feedback.suggestions)) feedback.suggestions = [];
    if (!feedback.corrected_version || typeof feedback.corrected_version !== 'string') feedback.corrected_version = '';
    if (!feedback.advice || typeof feedback.advice !== 'string') feedback.advice = '';
    if (!Array.isArray(feedback.vocabulary_analysis)) feedback.vocabulary_analysis = [];
    
    console.log('✅ Đã kiểm tra và chuẩn hóa dữ liệu feedback');

    const score = Math.round((feedback.accuracy / 100) * 10);
    console.log('📊 Score calculated:', score);
    
    try {
      await prisma.writing_submissions.update({
        where: { id: submission.id },
        data: {
          score: score,
          feedback: feedback.feedback,
          errors: JSON.stringify(feedback.errors),
          suggestions: JSON.stringify(feedback.suggestions),
          corrected_version: feedback.corrected_version,
          advice: feedback.advice
        }
      });
      console.log('✅ Đã update submission thành công');
    } catch (updateError) {
      console.error('❌ Lỗi update submission:', updateError);
      return res.status(500).json({ error: 'Lỗi update submission', detail: String(updateError) });
    }

    return res.status(200).json(feedback);
  } catch (error) {
    console.error('❌ Error in writing submission:', error);
    return res.status(500).json({ error: 'Internal server error', detail: String(error) });
  }
}