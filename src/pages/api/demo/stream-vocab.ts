import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logWithTimestamp, logErrorWithTimestamp } from '@/utils/logger';
import { safeJsonParse, extractJson } from '@/utils/jsonUtils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, level = 'intermediate', count = 8 } = req.body;
  
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Bạn là một hệ thống tạo từ vựng tiếng Anh. Hãy trả về kết quả dưới dạng một chuỗi các đối tượng JSON, mỗi đối tượng trên một dòng (định dạng JSONL). Không được trả về bất cứ thứ gì khác ngoài chuỗi JSONL này.

Mỗi đối tượng JSON phải đại diện cho một từ vựng và chứa các key sau:
- id: số thứ tự
- word: từ tiếng Anh
- pronunciation: phiên âm IPA
- partOfSpeech: loại từ (noun, verb, adjective, etc.)
- meaning: nghĩa tiếng Việt
- example: câu ví dụ tiếng Anh
- exampleTranslation: bản dịch câu ví dụ
- difficulty: mức độ khó (1-5)
- synonyms: mảng từ đồng nghĩa (tối đa 3 từ)

Chủ đề: "${topic}"
Mức độ: ${level}
Số lượng từ: ${count}

Ví dụ format:
{"id": 1, "word": "example", "pronunciation": "/ɪɡˈzæmpəl/", "partOfSpeech": "noun", "meaning": "ví dụ", "example": "This is a good example.", "exampleTranslation": "Đây là một ví dụ tốt.", "difficulty": 2, "synonyms": ["instance", "case", "sample"]}

Hãy tạo ${count} từ vựng liên quan đến chủ đề "${topic}" với mức độ ${level}.`;

    const result = await model.generateContentStream(prompt);

    // Set headers cho streaming JSONL
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let buffer = '';
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      buffer += text;
      
      // Kiểm tra xem có ký tự xuống dòng không
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        // Lấy ra dòng JSON hoàn chỉnh
        const completeLine = buffer.substring(0, newlineIndex).trim();
        buffer = buffer.substring(newlineIndex + 1); // Giữ lại phần còn lại trong buffer

        if (completeLine) {
          const vocabItem = safeJsonParse(completeLine);
          if (vocabItem && vocabItem.word && vocabItem.meaning && vocabItem.example) {
            const cleanJson = extractJson(completeLine);
            if (cleanJson) {
              res.write(cleanJson + '\n'); // Gửi dòng JSON về frontend
              
              // Thêm delay nhỏ để demo hiệu ứng streaming
              await new Promise(resolve => setTimeout(resolve, 150));
            }
          }
        }
      }
    }
    
    // Xử lý phần còn lại trong buffer (nếu có)
    if (buffer.trim()) {
      const vocabItem = safeJsonParse(buffer.trim());
      if (vocabItem && vocabItem.word && vocabItem.meaning && vocabItem.example) {
        const cleanJson = extractJson(buffer.trim());
        if (cleanJson) {
          res.write(cleanJson + '\n');
        }
      }
    }
    
    res.end();
  } catch (error) {
    logErrorWithTimestamp('Error in stream-vocab:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}