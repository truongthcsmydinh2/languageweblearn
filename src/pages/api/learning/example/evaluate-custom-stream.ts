import type { NextApiRequest, NextApiResponse } from 'next';
import { generateContentStream } from '@/lib/gemini';
import { safeJsonParse } from '@/utils/jsonUtils';

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
Bạn LÀ một giáo viên AI, chuyên chấm điểm và đưa ra phản hồi chi tiết. Trả về kết quả dưới dạng một chuỗi sự kiện JSONL (mỗi JSON trên một dòng mới).

**BỐI CẢNH:**
- Từ vựng: "${word}"
- Ý nghĩa: "${meaning}"
- Câu của học sinh: "${userAnswer}"

**YÊU CẦU (JSONL Stream):**
Sử dụng các key: \`e\` (event), \`k\` (key), \`c\` (content/chunk), \`v\` (value).

1.  **Bắt đầu:** Gửi ngay một sự kiện \`{"e": "start"}\`.
2.  **Điểm số tính trên thang 1-100 (IMPORTANCE):** Gửi ngay điểm số bằng \`{"e": "data", "k": "score", "v": number}\`.
3.  **Phản hồi (\`feedback\`):** Stream từng từ bằng \`{"e": "data", "k": "feedback", "c": "từng_từ_một"}\`.
4.  **Lỗi sai (\`errors\`):** Stream từng từ bằng \`{"e": "data", "k": "errors", "c": "từng_từ_một"}\`. Nếu không có lỗi, gửi "Không có lỗi đáng kể" từng từ.
5.  **Gợi ý (\`suggestions\`):** Stream từng từ bằng \`{"e": "data", "k": "suggestions", "c": "từng_từ_một"}\`.
6.  **Ví dụ (\`examples\`):** Stream từng từ bằng \`{"e": "data", "k": "examples", "c": "từng_từ_một"}\`.
7.  **Kết thúc:** Gửi một sự kiện \`{"e": "end"}\`.

**QUAN TRỌNG:** Mỗi đối tượng JSON phải nằm trên một dòng riêng biệt. KHÔNG sử dụng markdown code block (dấu \`\`\`). Tuyệt đối không thêm bất kỳ ký tự nào sau dấu \`}\` của một đối tượng JSON trên cùng một dòng.
`;

    console.log(`📤 [${requestId}] Bắt đầu streaming đánh giá từ Gemini API`);
    console.log(`🌏 [${requestId}] Region: asia-southeast1 (Singapore) - Streaming thực sự`);
    console.log(`📝 [${requestId}] Prompt length: ${prompt.length} characters`);
    
    // Thiết lập JSONL headers
    console.log(`🔧 [${requestId}] Setting up JSONL headers...`);
    const jsonlHeaders = {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    };
    console.log(`📡 [${requestId}] JSONL Headers:`, jsonlHeaders);
    res.writeHead(200, jsonlHeaders);
    console.log(`✅ [${requestId}] JSONL headers set successfully`);
    
    // Gửi sự kiện bắt đầu
    res.write(JSON.stringify({ e: 'start' }) + '\n');

    const startTime = Date.now();
    console.log(`⏱️ [${requestId}] Streaming started at: ${new Date(startTime).toISOString()}`);
    
    try {
      // Sử dụng streaming API thực sự
      console.log(`🔄 [${requestId}] Calling generateContentStream with model: gemini-1.5-flash`);
      const streamResult = await generateContentStream(prompt, 'gemini-1.5-flash');
      console.log(`✅ [${requestId}] Stream connection established`);
      
      let buffer = '';
      let chunkCounter = 0;

      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text();
        console.log(`🔍 [${requestId}] RAW Gemini chunk:`, JSON.stringify(chunkText));
        
        buffer += chunkText;
        
        // Xử lý trường hợp Gemini trả về nhiều JSON trên cùng một dòng bằng cách chèn newline
        // Đây là bước quan trọng để phòng trường hợp nhiều JSON object liền nhau
        buffer = buffer.replace(/}\s*{/g, '}\n{');
        console.log(`📋 [${requestId}] Buffer after processing:`, JSON.stringify(buffer));

        let lines = buffer.split('\n');
        
        // Giữ lại dòng cuối (có thể chưa hoàn chỉnh) trong buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === '') continue;

          // Kiểm tra và bỏ qua mọi dòng định dạng markdown (```json, ```jsonl, ```)
          // Logic này giúp làm sạch stream trước khi gửi về client.
          if (trimmedLine.startsWith('```')) {
            console.log(`🔄 [${requestId}] Skipping markdown wrapper: "${trimmedLine}"`);
            continue; // Bỏ qua, không gửi dòng này về client
          }
          
          chunkCounter++;
          // Gửi dòng đã được làm sạch về client, mỗi dòng là một JSON object.
          res.write(trimmedLine + '\n');

          // Log để debug phía server
          const jsonData = safeJsonParse(trimmedLine);
          if (jsonData) {
            if (jsonData.e === 'data' && jsonData.k === 'score') {
              console.log(`🔢 [${requestId}] Streamed score: ${jsonData.v}`);
            }
          } else {
            console.warn(`⚠️ [${requestId}] Chunk #${chunkCounter} is not valid JSON (server-side log only): "${trimmedLine}"`);
          }
        }
      }

      // Xử lý phần còn lại trong buffer sau khi stream kết thúc
      const finalTrimmedLine = buffer.trim();
      if (finalTrimmedLine !== '') {
        // Đảm bảo không gửi dòng markdown cuối cùng nếu có
        if (!finalTrimmedLine.startsWith('```')) {
          res.write(finalTrimmedLine + '\n');
          console.log(`🔄 [${requestId}] Wrote final buffer content: "${finalTrimmedLine}"`);
        } else {
          console.log(`🔄 [${requestId}] Skipping final markdown wrapper: "${finalTrimmedLine}"`);
        }
      }

      const totalDuration = Date.now() - startTime;
       console.log(`⏱️ [${requestId}] Total streaming and processing time: ${totalDuration}ms`);
       
       console.log(`✅ [${requestId}] Stream completed successfully`);
       
       res.end(); // Kết thúc response
       console.log(`✅ [${requestId}] Stream completed and response ended.`);
      
    } catch (streamingError) {
      console.error(`❌ [${requestId}] Lỗi streaming:`, streamingError);
      console.error(`❌ [${requestId}] Stack trace:`, (streamingError as Error).stack);
      
      // Gửi lỗi về client theo format JSONL
      if (!res.writableEnded) {
        res.write(JSON.stringify({ e: 'data', k: 'feedback', c: 'Lỗi khi đánh giá' }) + '\n');
        res.write(JSON.stringify({ e: 'end' }) + '\n');
        res.end();
      }
      console.log(`❌ [${requestId}] Error sent to client`);
    }
    
  } catch (error) {
    console.error(`❌ [${requestId}] Critical error in streaming evaluation:`, error);
    console.error(`❌ [${requestId}] Error stack:`, (error as Error).stack);
    
    // Gửi lỗi về client nếu chưa gửi headers
    if (!res.headersSent) {
      console.log(`📤 [${requestId}] Sending JSON error response (headers not sent yet)`);
      return res.status(500).json({ error: 'Internal server error', detail: String(error) });
    }
    
    // Nếu đã gửi headers, gửi lỗi qua JSONL
    if (!res.writableEnded) {
      console.log(`📤 [${requestId}] Sending JSONL error response (headers already sent)`);
      res.write(JSON.stringify({ e: 'data', k: 'feedback', c: 'Lỗi máy chủ nội bộ' }) + '\n');
      res.write(JSON.stringify({ e: 'end' }) + '\n');
      res.end();
    }
    console.log(`❌ [${requestId}] Critical error handled and response ended`);
  }
  console.log(`🏁 [${requestId}] API Handler completed`);
}