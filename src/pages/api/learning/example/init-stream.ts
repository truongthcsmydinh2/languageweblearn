import type { NextApiRequest, NextApiResponse } from 'next';
import { generateContentStream, generateContentWithTiming } from '../../../../lib/gemini';
import { logWithTimestamp, logErrorWithTimestamp } from '../../../../utils/logger';
import { getVocabByIds, getRandomVocab, Vocab } from '../../../../lib/vocab';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = Math.random().toString(36).substr(2, 9);
  logWithTimestamp(`🚀 [${requestId}] API Request Started - init-stream (event-based)`);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { count, words } = req.query;
    let vocabList: Vocab[];

    if (words) {
      vocabList = await getVocabByIds(words as string);
    } else {
      const vocabCount = parseInt(count as string, 10) || 10;
      vocabList = await getRandomVocab(vocabCount);
    }

    if (!vocabList || vocabList.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy từ vựng' });
    }

    logWithTimestamp(`📥 [${requestId}] Retrieved ${vocabList.length} vocab items`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    logWithTimestamp(`✅ [${requestId}] Headers set for streaming`);

    try {
      // Tạo dữ liệu trực tiếp từ vocab list
      for (const vocab of vocabList) {
        // Khởi tạo từ mới
        const startEvent = { e: 'start' };
        res.write(JSON.stringify(startEvent) + '\n');
        
        // Thêm ID và từ
        const idEvent = { e: 'data', k: 'id', v: vocab.id };
        res.write(JSON.stringify(idEvent) + '\n');
        
        const wordEvent = { e: 'data', k: 'word', v: vocab.word };
        res.write(JSON.stringify(wordEvent) + '\n');
        
        // Thêm nghĩa
        if (vocab.meaning) {
          const meaningEvent = { e: 'data', k: 'meaning', v: vocab.meaning };
          res.write(JSON.stringify(meaningEvent) + '\n');
        }
        
        // Tạo câu ví dụ bằng Gemini
        const prompt = `Tạo 1 câu ví dụ ngắn gọn bằng tiếng Việt cho từ tiếng Anh "${vocab.word}" với nghĩa "${vocab.meaning}". Câu ví dụ phải bằng tiếng Việt và sử dụng từ tiếng Anh "${vocab.word}" trong câu. Mỗi câu trên một dòng, không đánh số.`;
        
        try {
          const result = await generateContentStream(prompt, 'gemini-1.5-flash');
          let exampleText = '';
          
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            console.log(`🔍 [${requestId}] RAW Gemini chunk for word "${vocab.word}":`, JSON.stringify(chunkText));
            
            exampleText += chunkText;
            
            // Làm sạch chunk text trước khi gửi
            const cleanChunkText = chunkText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
            console.log(`🧹 [${requestId}] Cleaned chunk:`, JSON.stringify(cleanChunkText));
            
            // Stream từng chunk của ví dụ
            const exampleEvent = { e: 'data', k: 'examples', c: cleanChunkText };
            res.write(JSON.stringify(exampleEvent) + '\n');
          }
        } catch (geminiError) {
          logErrorWithTimestamp(`❌ [${requestId}] Gemini error for word ${vocab.word}:`, geminiError);
          // Fallback: tạo ví dụ đơn giản
          const fallbackExample = `This is an example sentence using the word "${vocab.word}".`;
          const exampleEvent = { e: 'data', k: 'examples', c: fallbackExample };
          res.write(JSON.stringify(exampleEvent) + '\n');
        }
        
        // Kết thúc từ
        const endEvent = { e: 'end' };
        res.write(JSON.stringify(endEvent) + '\n');
      }
      
      logWithTimestamp(`✅ [${requestId}] All vocab items processed.`);
    } catch (streamingError) {
      logErrorWithTimestamp(`❌ [${requestId}] Streaming error:`, streamingError);
      const errorData = { e: 'error', v: 'Lỗi khi tạo câu ví dụ' };
      res.write(JSON.stringify(errorData) + '\n');
    }

    res.end();
    logWithTimestamp(`✅ [${requestId}] Request stream completed successfully.`);

  } catch (error) {
    logErrorWithTimestamp(`❌ [${requestId}] Critical error:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      const errorData = { e: 'error', v: 'Lỗi máy chủ nội bộ' };
      res.write(JSON.stringify(errorData) + '\n');
      res.end();
    }
  }
}