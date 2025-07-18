import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logWithTimestamp, logErrorWithTimestamp } from '@/utils/logger';
import { safeJsonParse, extractJson } from '@/utils/jsonUtils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Bạn là một API tìm kiếm sản phẩm. Hãy trả về kết quả dưới dạng một chuỗi các đối tượng JSON, mỗi đối tượng trên một dòng (định dạng JSONL). Không được trả về bất cứ thứ gì khác ngoài chuỗi JSONL này.

Mỗi đối tượng JSON phải đại diện cho một sản phẩm và chứa các key sau: id, tenSP, moTaNgan, gia, urlHinhAnh.

Dựa vào yêu cầu "${query}", hãy tạo ra 5 sản phẩm.

Ví dụ format:
{"id": 1, "tenSP": "Tên sản phẩm", "moTaNgan": "Mô tả ngắn", "gia": "1,000,000 VND", "urlHinhAnh": "/images/product1.jpg"}
{"id": 2, "tenSP": "Tên sản phẩm 2", "moTaNgan": "Mô tả ngắn 2", "gia": "2,000,000 VND", "urlHinhAnh": "/images/product2.jpg"}`;

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
          const cleanJson = extractJson(completeLine);
          if (cleanJson) {
            res.write(cleanJson + '\n'); // Gửi dòng JSON về frontend
            
            // Thêm delay nhỏ để demo hiệu ứng streaming
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    }
    
    // Xử lý phần còn lại trong buffer (nếu có)
    if (buffer.trim()) {
      const cleanJson = extractJson(buffer.trim());
      if (cleanJson) {
        res.write(cleanJson + '\n');
      }
    }
    
    res.end();
  } catch (error) {
    logErrorWithTimestamp('Error in stream-products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}