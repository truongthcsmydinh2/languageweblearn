import type { NextApiRequest, NextApiResponse } from 'next';
import { generateContentStream } from '@/lib/gemini';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Prompt đơn giản để test streaming
    const prompt = `Hãy viết một câu chuyện ngắn về một chú mèo tên Tom trong khoảng 200 từ. Viết từ từ và chi tiết.`;
    
    console.log('🚀 Bắt đầu simple streaming test');
    
    // Thiết lập SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const startTime = Date.now();
    let accumulatedText = '';
    let chunkCount = 0;
    
    try {
      // Sử dụng streaming API
      const streamResult = await generateContentStream(prompt, 'gemini-1.5-flash');
      
      // Xử lý từng chunk dữ liệu ngay lập tức
      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text();
        accumulatedText += chunkText;
        chunkCount++;
        
        // Gửi chunk về client ngay lập tức qua SSE
        const eventData = {
          type: 'chunk',
          data: chunkText,
          accumulated: accumulatedText,
          chunkNumber: chunkCount,
          timestamp: Date.now() - startTime
        };
        
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
        
        // Flush ngay lập tức để client nhận được chunk
        if ('flush' in res && typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
        
        console.log(`📦 Simple Chunk ${chunkCount}: "${chunkText}" (${chunkText.length} chars, ${Date.now() - startTime}ms)`);
        
        // Thêm delay nhỏ để tạo hiệu ứng streaming rõ ràng hơn
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Gửi kết quả hoàn thành
      const finalEventData = {
        type: 'complete',
        result: {
          text: accumulatedText,
          totalChunks: chunkCount,
          totalTime: Date.now() - startTime
        }
      };
      
      res.write(`data: ${JSON.stringify(finalEventData)}\n\n`);
      res.write('data: [DONE]\n\n');
      
      console.log(`✅ Simple streaming hoàn thành: ${chunkCount} chunks, ${Date.now() - startTime}ms`);
      
    } catch (streamingError) {
      console.error('❌ Lỗi simple streaming:', streamingError);
      
      const errorEventData = {
        type: 'error',
        error: 'Streaming failed',
        message: String(streamingError)
      };
      
      res.write(`data: ${JSON.stringify(errorEventData)}\n\n`);
      res.write('data: [DONE]\n\n');
    }
    
    res.end();
    
  } catch (error) {
    console.error('❌ Error in simple streaming test:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error', detail: String(error) });
    }
    
    const errorEventData = {
      type: 'error',
      error: 'Internal server error',
      message: String(error)
    };
    
    res.write(`data: ${JSON.stringify(errorEventData)}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}