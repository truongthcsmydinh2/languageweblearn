import type { NextApiRequest, NextApiResponse } from 'next';
import { generateContentStream } from '@/lib/gemini';

interface EvaluationResult {
  score: number;
  feedback: string;
  errors: string[];
  suggestions: string[];
  examples: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`🚀 [${requestId}] API Request Started - evaluate-custom-stream`);
  console.log(`📋 [${requestId}] Method: ${req.method}`);
  console.log(`🔗 [${requestId}] URL: ${req.url}`);
  console.log(`📡 [${requestId}] Headers:`, {
    'user-agent': req.headers['user-agent'],
    'content-type': req.headers['content-type'],
    'firebase_uid': req.headers.firebase_uid ? '***' : 'missing'
  });

  if (req.method !== 'POST') {
    console.log(`❌ [${requestId}] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  if (!firebase_uid) {
    console.log(`❌ [${requestId}] Unauthorized - Missing firebase_uid`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.log(`✅ [${requestId}] Authentication successful`);

  try {
    const { word, meaning, userAnswer } = req.body;
    
    console.log(`📥 [${requestId}] Request payload validation:`);
    console.log(`   - word: ${word ? '✅' : '❌'} (${word})`);
    console.log(`   - meaning: ${meaning ? '✅' : '❌'} (${meaning})`);
    console.log(`   - userAnswer: ${userAnswer ? '✅' : '❌'} (length: ${userAnswer?.length || 0})`);
    
    if (!word || !meaning || !userAnswer) {
      console.log(`❌ [${requestId}] Missing required fields`);
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    console.log(`📥 [${requestId}] Full Request payload:`, { word, meaning, userAnswer });
    
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

    console.log(`📤 [${requestId}] Bắt đầu streaming đánh giá từ Gemini API`);
    console.log(`🌏 [${requestId}] Region: asia-southeast1 (Singapore) - Streaming thực sự`);
    console.log(`📝 [${requestId}] Prompt length: ${prompt.length} characters`);
    
    // Thiết lập SSE headers
    console.log(`🔧 [${requestId}] Setting up SSE headers...`);
    const sseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    };
    console.log(`📡 [${requestId}] SSE Headers:`, sseHeaders);
    res.writeHead(200, sseHeaders);
    console.log(`✅ [${requestId}] SSE headers set successfully`);

    const startTime = Date.now();
    let accumulatedText = '';
    let chunkCount = 0;
    console.log(`⏱️ [${requestId}] Streaming started at: ${new Date(startTime).toISOString()}`);
    
    try {
      // Sử dụng streaming API thực sự
      console.log(`🔄 [${requestId}] Calling generateContentStream with model: gemini-1.5-flash`);
      const streamResult = await generateContentStream(prompt, 'gemini-1.5-flash');
      console.log(`✅ [${requestId}] Stream connection established`);
      
      let originalChunkCount = 0;
      // Xử lý từng chunk dữ liệu ngay lập tức
      console.log(`🔄 [${requestId}] Starting to process stream chunks...`);
      for await (const chunk of streamResult.stream) {
        originalChunkCount++;
        const chunkText = chunk.text();
        console.log(`📦 [${requestId}] Original Chunk ${originalChunkCount}: "${chunkText}" (${chunkText.length} chars)`);
        
        // Chia nhỏ chunk thành các phần nhỏ hơn để tạo hiệu ứng streaming
        const words = chunkText.split(' ');
        console.log(`✂️ [${requestId}] Split into ${words.length} words for streaming effect`);
        
        for (let i = 0; i < words.length; i++) {
          const wordChunk = words[i] + (i < words.length - 1 ? ' ' : '');
          accumulatedText += wordChunk;
          chunkCount++;
          
          // Gửi chunk nhỏ về client ngay lập tức qua SSE
          const eventData = {
            type: 'chunk',
            data: wordChunk,
            accumulated: accumulatedText,
            chunkNumber: chunkCount,
            timestamp: Date.now() - startTime
          };
          
          const eventString = `data: ${JSON.stringify(eventData)}\n\n`;
          res.write(eventString);
          
          // Flush ngay lập tức để client nhận được chunk
          const hasFlush = 'flush' in res && typeof (res as any).flush === 'function';
          if (hasFlush) {
            (res as any).flush();
          }
          
          console.log(`📤 [${requestId}] Sent Chunk ${chunkCount}: "${wordChunk}" (${wordChunk.length} chars, ${Date.now() - startTime}ms, flush: ${hasFlush})`);
          
          // Thêm delay để tạo hiệu ứng typing
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      console.log(`🏁 [${requestId}] Stream processing completed. Original chunks: ${originalChunkCount}, Split chunks: ${chunkCount}`);
      
      // Xử lý kết quả cuối cùng
      console.log(`🔄 [${requestId}] Parsing final JSON result...`);
      console.log(`📊 [${requestId}] Accumulated text length: ${accumulatedText.length} characters`);
      console.log(`📄 [${requestId}] Raw accumulated text:`, accumulatedText.substring(0, 200) + (accumulatedText.length > 200 ? '...' : ''));
      
      let finalResult: EvaluationResult;
      
      try {
        // Loại bỏ markdown và parse JSON
        console.log(`🧹 [${requestId}] Cleaning text for JSON parsing...`);
        const cleanText = accumulatedText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```\s*$/i, '')
          .trim();
        
        console.log(`🧹 [${requestId}] Cleaned text length: ${cleanText.length}`);
        console.log(`📄 [${requestId}] Cleaned text preview:`, cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : ''));
        
        console.log(`🔄 [${requestId}] Attempting JSON.parse...`);
        const parsed = JSON.parse(cleanText);
        console.log(`✅ [${requestId}] JSON parsed successfully:`, {
          hasScore: 'score' in parsed,
          hasFeedback: 'feedback' in parsed,
          hasErrors: 'errors' in parsed,
          hasSuggestions: 'suggestions' in parsed,
          hasExamples: 'examples' in parsed
        });
        
        finalResult = {
          score: parsed.score || 0,
          feedback: parsed.feedback || '',
          errors: parsed.errors || [],
          suggestions: parsed.suggestions || [],
          examples: parsed.examples || []
        };
        
        console.log(`✅ [${requestId}] Streaming hoàn thành: ${chunkCount} chunks, ${Date.now() - startTime}ms`);
        console.log(`📊 [${requestId}] Final result:`, {
          score: finalResult.score,
          feedbackLength: finalResult.feedback.length,
          errorsCount: finalResult.errors.length,
          suggestionsCount: finalResult.suggestions.length,
          examplesCount: finalResult.examples.length
        });
        
      } catch (parseError) {
        console.error(`❌ [${requestId}] Lỗi parse JSON:`, parseError);
        console.log(`📄 [${requestId}] Full raw text for debugging:`, accumulatedText);
        
        finalResult = {
          score: 50,
          feedback: 'Lỗi parse response từ Gemini',
          errors: ['Không thể phân tích kết quả'],
          suggestions: [],
          examples: []
        };
        console.log(`🔧 [${requestId}] Using fallback result due to parse error`);
      }
      
      // Gửi kết quả cuối cùng
      console.log(`📤 [${requestId}] Preparing final event data...`);
      const finalEventData = {
        type: 'complete',
        result: finalResult,
        totalChunks: chunkCount,
        totalTime: Date.now() - startTime,
        method: 'streaming'
      };
      
      console.log(`📤 [${requestId}] Sending final result to client...`);
      const finalEventString = `data: ${JSON.stringify(finalEventData)}\n\n`;
      res.write(finalEventString);
      console.log(`📤 [${requestId}] Final event sent, size: ${finalEventString.length} chars`);
      
      console.log(`🏁 [${requestId}] Sending [DONE] signal...`);
      res.write('data: [DONE]\n\n');
      console.log(`✅ [${requestId}] Stream completed successfully`);
      
    } catch (streamingError) {
      console.error(`❌ [${requestId}] Lỗi streaming:`, streamingError);
      console.error(`❌ [${requestId}] Stack trace:`, (streamingError as Error).stack);
      
      // Gửi lỗi về client
      const errorEventData = {
        type: 'error',
        error: 'Streaming failed',
        message: String(streamingError),
        timestamp: Date.now() - startTime
      };
      
      console.log(`📤 [${requestId}] Sending error to client...`);
      res.write(`data: ${JSON.stringify(errorEventData)}\n\n`);
      res.write('data: [DONE]\n\n');
      console.log(`❌ [${requestId}] Error sent to client`);
    }
    
    console.log(`🔚 [${requestId}] Ending response...`);
    res.end();
    console.log(`✅ [${requestId}] Response ended successfully`);
    
  } catch (error) {
    console.error(`❌ [${requestId}] Critical error in streaming evaluation:`, error);
    console.error(`❌ [${requestId}] Error stack:`, (error as Error).stack);
    console.log(`🔍 [${requestId}] Headers sent status: ${res.headersSent}`);
    
    // Gửi lỗi về client nếu chưa gửi headers
    if (!res.headersSent) {
      console.log(`📤 [${requestId}] Sending JSON error response (headers not sent yet)`);
      return res.status(500).json({ error: 'Internal server error', detail: String(error) });
    }
    
    // Nếu đã gửi headers, gửi lỗi qua SSE
    console.log(`📤 [${requestId}] Sending SSE error response (headers already sent)`);
    const errorEventData = {
      type: 'error',
      error: 'Internal server error',
      message: String(error)
    };
    
    res.write(`data: ${JSON.stringify(errorEventData)}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    console.log(`❌ [${requestId}] Critical error handled and response ended`);
  }
  console.log(`🏁 [${requestId}] API Handler completed`);
}