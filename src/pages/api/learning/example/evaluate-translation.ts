import type { NextApiRequest, NextApiResponse } from 'next';
import { generateContentWithTiming, generateJSONContent } from '@/lib/gemini';

interface EvaluationResult {
  score: number;
  feedback: string;
  errors: string[];
  suggestions: string[];
  correctAnswer: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Tạo request ID duy nhất
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [${requestId}] Starting translation evaluation API handler`);
  console.log(`📋 [${requestId}] Method: ${req.method}`);
  console.log(`🔗 [${requestId}] URL: ${req.url}`);
  console.log(`📊 [${requestId}] Headers:`, {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
    'firebase_uid': req.headers.firebase_uid ? 'present' : 'missing'
  });

  if (req.method !== 'POST') {
    console.log(`❌ [${requestId}] Invalid method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  if (!firebase_uid) {
    console.log(`❌ [${requestId}] Missing firebase_uid in headers`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.log(`✅ [${requestId}] Firebase UID authenticated: ${firebase_uid.substring(0, 8)}...`);

  try {
    const { word, meaning, example, userAnswer } = req.body;
    console.log(`📥 [${requestId}] Request payload:`, { word, meaning, example, userAnswer });
    
    if (!word || !meaning || !example || !userAnswer) {
      console.log(`❌ [${requestId}] Missing required fields:`, {
        word: !!word,
        meaning: !!meaning,
        example: !!example,
        userAnswer: !!userAnswer
      });
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    console.log(`✅ [${requestId}] All required fields present`);
    
    // Tạo prompt cho Gemini API
    console.log(`🔧 [${requestId}] Creating prompt for Gemini API...`);
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
    console.log(`📝 [${requestId}] Prompt created, length: ${prompt.length} characters`);

    console.log(`📤 [${requestId}] Gửi yêu cầu đánh giá tới Gemini API với Streaming`);
    console.log(`🌏 [${requestId}] Region: asia-southeast1 (Singapore) - Tối ưu tốc độ`);
    const startTime = Date.now();
    console.log(`⏰ [${requestId}] Starting API call at: ${new Date().toISOString()}`);
    
    let evaluation: EvaluationResult | null = null;
    console.log(`🔄 [${requestId}] Initializing evaluation variable`);
    
    try {
      // Sử dụng streaming API để tăng tốc độ phản hồi
      console.log(`🚀 [${requestId}] Calling generateJSONContent with streaming...`);
      const result = await generateJSONContent(prompt, 'gemini-1.5-flash');
      const streamingDuration = Date.now() - startTime;
      console.log(`⚡ [${requestId}] Thời gian phản hồi streaming: ${streamingDuration}ms`);
      console.log(`📊 [${requestId}] Streaming result type: ${typeof result}`);
      console.log(`📊 [${requestId}] Streaming result preview:`, JSON.stringify(result).substring(0, 200) + '...');
      
      if (result && typeof result === 'object') {
        evaluation = result as EvaluationResult;
        console.log(`✅ [${requestId}] Parsed evaluation từ streaming response`);
        console.log(`📋 [${requestId}] Evaluation score: ${evaluation.score}`);
        console.log(`📋 [${requestId}] Feedback length: ${evaluation.feedback?.length || 0} chars`);
        console.log(`📋 [${requestId}] Errors count: ${evaluation.errors?.length || 0}`);
        console.log(`📋 [${requestId}] Suggestions count: ${evaluation.suggestions?.length || 0}`);
      } else {
        console.warn(`⚠️ [${requestId}] Streaming response không có format mong đợi, thử parse thủ công`);
        console.log(`🔍 [${requestId}] Raw result:`, result);
        // Fallback parsing logic sẽ được xử lý bên dưới
      }

      // Nếu streaming thành công và có evaluation, sử dụng kết quả đó
      if (!evaluation) {
        console.log(`🔄 [${requestId}] Thử parse từ raw streaming response...`);
        // Logic fallback parsing có thể được thêm vào đây nếu cần
      }
      
    } catch (streamingError) {
      console.error(`❌ [${requestId}] Lỗi streaming API:`, streamingError);
      console.error(`❌ [${requestId}] Streaming error stack:`, (streamingError as Error).stack);
      console.log(`🔄 [${requestId}] Fallback to standard API...`);
      
      try {
        // Fallback to standard API
        console.log(`🚀 [${requestId}] Calling generateContentWithTiming fallback...`);
        const fallbackResult = await generateContentWithTiming(prompt, 'gemini-1.5-flash', false);
        console.log(`⚡ [${requestId}] Thời gian phản hồi fallback: ${fallbackResult.duration}ms`);
        console.log(`📊 [${requestId}] Fallback result text length: ${fallbackResult.text?.length || 0} chars`);
        console.log(`📄 [${requestId}] Fallback raw text preview:`, fallbackResult.text?.substring(0, 200) + '...');
        
        try {
          console.log(`🔍 [${requestId}] Parsing JSON from fallback response...`);
          // Tìm và parse JSON trong text
          let jsonMatch = fallbackResult.text.match(/\{[\s\S]*\}/);
          let jsonText = jsonMatch ? jsonMatch[0] : fallbackResult.text;
          console.log(`📝 [${requestId}] JSON match found: ${!!jsonMatch}`);
          console.log(`📝 [${requestId}] JSON text length: ${jsonText.length} chars`);
          
          // Loại bỏ markdown trước khi parse
          const originalJsonText = jsonText;
          jsonText = jsonText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```\s*$/i, '')
            .trim();
          console.log(`🧹 [${requestId}] Cleaned JSON text (${originalJsonText.length} -> ${jsonText.length} chars)`);
          
          const parsed = JSON.parse(jsonText);
          console.log(`✅ [${requestId}] Successfully parsed JSON from fallback`);
          console.log(`📊 [${requestId}] Parsed object keys:`, Object.keys(parsed));
          
          evaluation = {
            score: parsed.score || 0,
            feedback: parsed.feedback || '',
            errors: parsed.errors || [],
            suggestions: parsed.suggestions || [],
            correctAnswer: parsed.correctAnswer || parsed.correct_answer || ''
          };
          
          console.log(`✅ [${requestId}] Parsed evaluation từ fallback:`, {
            score: evaluation.score,
            feedbackLength: evaluation.feedback.length,
            errorsCount: evaluation.errors.length,
            suggestionsCount: evaluation.suggestions.length,
            hasCorrectAnswer: !!evaluation.correctAnswer
          });
        } catch (parseError) {
          console.error(`❌ [${requestId}] Lỗi parse JSON fallback:`, parseError);
          console.error(`❌ [${requestId}] Parse error stack:`, (parseError as Error).stack);
          console.log(`📄 [${requestId}] Raw text:`, fallbackResult.text);
          return res.status(500).json({ error: 'Lỗi parse response từ Gemini' });
        }
        
      } catch (fallbackError) {
        console.error(`❌ [${requestId}] Cả streaming và fallback đều thất bại:`, fallbackError);
        console.error(`❌ [${requestId}] Fallback error stack:`, (fallbackError as Error).stack);
        return res.status(500).json({ error: 'Lỗi khi gọi Gemini API' });
      }
    }

    let evaluationResult: EvaluationResult;
    console.log(`🔧 [${requestId}] Processing final evaluation result...`);

    // Sử dụng evaluation từ streaming hoặc fallback
    if (evaluation) {
      console.log(`✅ [${requestId}] Using evaluation from API response`);
      evaluationResult = evaluation;
    } else {
      console.log(`⚠️ [${requestId}] No evaluation from API, using default fallback`);
      // Default fallback nếu cả hai đều thất bại
      evaluationResult = {
        score: 50,
        feedback: 'Không thể đánh giá câu dịch này',
        errors: [],
        suggestions: [],
        correctAnswer: ''
      };
    }

    console.log(`🔍 [${requestId}] Validating evaluation result fields...`);
    // Kiểm tra và đảm bảo các trường đúng kiểu
    const originalScore = evaluationResult.score;
    if (!evaluationResult.score || isNaN(evaluationResult.score)) evaluationResult.score = 50;
    if (originalScore !== evaluationResult.score) {
      console.log(`🔧 [${requestId}] Fixed invalid score: ${originalScore} -> ${evaluationResult.score}`);
    }
    
    const originalFeedback = evaluationResult.feedback;
    if (!evaluationResult.feedback || typeof evaluationResult.feedback !== 'string') evaluationResult.feedback = '';
    if (originalFeedback !== evaluationResult.feedback) {
      console.log(`🔧 [${requestId}] Fixed invalid feedback type`);
    }
    
    if (!Array.isArray(evaluationResult.errors)) {
      console.log(`🔧 [${requestId}] Fixed invalid errors field (was ${typeof evaluationResult.errors})`);
      evaluationResult.errors = [];
    }
    
    if (!Array.isArray(evaluationResult.suggestions)) {
      console.log(`🔧 [${requestId}] Fixed invalid suggestions field (was ${typeof evaluationResult.suggestions})`);
      evaluationResult.suggestions = [];
    }
    
    const originalCorrectAnswer = evaluationResult.correctAnswer;
    if (!evaluationResult.correctAnswer || typeof evaluationResult.correctAnswer !== 'string') evaluationResult.correctAnswer = '';
    if (originalCorrectAnswer !== evaluationResult.correctAnswer) {
      console.log(`🔧 [${requestId}] Fixed invalid correctAnswer type`);
    }
    
    console.log(`✅ [${requestId}] Final evaluation result validated:`, {
      score: evaluationResult.score,
      feedbackLength: evaluationResult.feedback.length,
      errorsCount: evaluationResult.errors.length,
      suggestionsCount: evaluationResult.suggestions.length,
      hasCorrectAnswer: !!evaluationResult.correctAnswer
    });
    
    // Lưu kết quả đánh giá vào cơ sở dữ liệu (nếu cần)
    // TODO: Implement this if needed
    console.log(`💾 [${requestId}] Database save skipped (not implemented)`);

    const totalDuration = Date.now() - startTime;
    console.log(`📤 [${requestId}] Sending final result to client...`);
    console.log(`⏱️ [${requestId}] Total processing time: ${totalDuration}ms`);
    console.log(`✅ [${requestId}] Translation evaluation completed successfully`);
    
    return res.status(200).json(evaluationResult);
  } catch (error) {
    console.error(`❌ [${requestId}] Critical error in translation evaluation:`, error);
    console.error(`❌ [${requestId}] Error stack:`, (error as Error).stack);
    console.log(`📤 [${requestId}] Sending error response to client`);
    return res.status(500).json({ error: 'Internal server error', detail: String(error) });
  }
  console.log(`🏁 [${requestId}] API Handler completed`);
}