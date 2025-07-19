import type { NextApiRequest, NextApiResponse } from 'next';
import { generateContentStream } from '@/lib/gemini';
import { safeJsonParse, extractJson } from '@/utils/jsonUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [${requestId}] Starting Q&A streaming API handler`);

  if (req.method !== 'POST') {
    console.log(`❌ [${requestId}] Invalid method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  if (!firebase_uid) {
    console.log(`❌ [${requestId}] Missing firebase_uid in headers`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.log(`✅ [${requestId}] Firebase UID authenticated`);

  try {
    const { word, meaning, example, userAnswer, evaluationResult, question } = req.body;
    if (!word || !meaning || !example || !userAnswer || !question) {
      console.log(`❌ [${requestId}] Missing required fields`);
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    console.log(`✅ [${requestId}] All required fields present`);
    
    // Create context-aware prompt
    const prompt = `
Bạn là một giáo viên tiếng Anh chuyên nghiệp và thân thiện. Học sinh vừa hoàn thành một bài tập dịch và có câu hỏi thêm.

**BỐI CẢNH BÀI TẬP:**
- Từ vựng: "${word}"
- Ý nghĩa: "${meaning}"
- Câu ví dụ gốc: "${example}"
- Câu dịch của học sinh: "${userAnswer}"
- Điểm số: ${evaluationResult?.score || 'N/A'}/100
- Nhận xét: ${evaluationResult?.feedback || 'N/A'}
- Lỗi đã phát hiện: ${evaluationResult?.errors?.join(', ') || 'Không có'}
- Gợi ý đã đưa ra: ${evaluationResult?.suggestions?.join(', ') || 'Không có'}

**CÂU HỎI CỦA HỌC SINH:**
"${question}"

**YÊU CẦU TRẢ LỜI:**
Hãy trả lời câu hỏi của học sinh một cách chi tiết, dễ hiểu và hữu ích. Sử dụng ngôn ngữ thân thiện, chuyên nghiệp. Nếu cần thiết, hãy đưa ra ví dụ cụ thể để minh họa.

Trả về kết quả dưới dạng JSONL stream với format:
- Bắt đầu: {"e": "start"}
- Nội dung: {"e": "data", "k": "response", "c": "từng_từ_một"}
- Kết thúc: {"e": "end"}

**QUAN TRỌNG:** Mỗi đối tượng JSON phải nằm trên một dòng riêng biệt. KHÔNG sử dụng markdown code block.
`;
    
    console.log(`📝 [${requestId}] Prompt created, length: ${prompt.length} characters`);

    // Set streaming headers
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    console.log(`✅ [${requestId}] Streaming headers set`);

    const startTime = Date.now();
    console.log(`📤 [${requestId}] Calling generateContentStream...`);
    
    // Call streaming API
    const streamResult = await generateContentStream(prompt, 'gemini-1.5-flash');
    
    let buffer = '';
    let chunkCounter = 0;

    // Send start event
    res.write('{"e": "start"}\n');

    for await (const chunk of streamResult.stream) {
      const chunkText = chunk.text();
      console.log(`🔍 [${requestId}] RAW Gemini chunk:`, JSON.stringify(chunkText));
      
      buffer += chunkText;
      
      // Process multiple JSON objects on same line
      buffer = buffer.replace(/}\s*{/g, '}\n{');
      console.log(`📋 [${requestId}] Buffer after processing:`, JSON.stringify(buffer));

      let lines = buffer.split('\n');
      
      // Keep last line (might be incomplete) in buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') continue;

        // Skip markdown wrappers
        if (trimmedLine.startsWith('```')) {
          console.log(`🔄 [${requestId}] Skipping markdown wrapper: "${trimmedLine}"`);
          continue;
        }
        
        chunkCounter++;
        
        // Validate JSON before sending to client
        const cleanJson = extractJson(trimmedLine);
        if (cleanJson) {
          const jsonData = safeJsonParse(cleanJson);
          if (jsonData) {
            // Send valid JSON to client
            res.write(cleanJson + '\n');
          }
        } else {
          console.warn(`⚠️ [${requestId}] Chunk #${chunkCounter} is not valid JSON, skipping: "${trimmedLine}"`);
        }
      }
    }

    // Process remaining buffer
    const finalTrimmedLine = buffer.trim();
    if (finalTrimmedLine !== '' && !finalTrimmedLine.startsWith('```')) {
      const cleanJson = extractJson(finalTrimmedLine);
      if (cleanJson) {
        res.write(cleanJson + '\n');
        console.log(`🔄 [${requestId}] Wrote final buffer content: "${finalTrimmedLine}"`);
      }
    }

    // Send end event
    res.write('{"e": "end"}\n');

    const totalDuration = Date.now() - startTime;
    console.log(`⏱️ [${requestId}] Total streaming time: ${totalDuration}ms`);
    
    res.end();
    console.log(`✅ [${requestId}] Q&A stream completed`);

  } catch (error) {
    console.error(`❌ [${requestId}] Critical error in Q&A stream:`, error);
    if (!res.writableEnded) {
      res.status(500).json({ error: 'Internal server error', detail: String(error) });
    } else {
      res.end();
    }
  }
}