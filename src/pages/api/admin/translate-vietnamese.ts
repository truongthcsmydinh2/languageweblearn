import type { NextApiRequest, NextApiResponse } from 'next';
import { generateContentWithTiming } from '@/lib/gemini';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vietnameseText, lessonType, lessonLevel } = req.body;
  if (!vietnameseText) {
    return res.status(400).json({ error: 'Thiếu văn bản tiếng Việt' });
  }

  try {
    console.log('🧠 Sử dụng Gemini API để dịch Việt → Anh');
    return await translateVietnameseToEnglish(vietnameseText, lessonType, lessonLevel, res);
  } catch (error) {
    console.error('❌ Lỗi khi dịch:', error);
    return res.status(500).json({ 
      error: 'Lỗi server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Hàm dịch tiếng Việt sang tiếng Anh bằng Gemini API
async function translateVietnameseToEnglish(vietnameseText: string, lessonType: string, lessonLevel: string, res: NextApiResponse) {
  // Tạo prompt cho Gemini: Dịch từ tiếng Việt sang tiếng Anh
  const prompt = `Bạn là một giáo viên tiếng Anh chuyên nghiệp. Hãy dịch đoạn văn tiếng Việt sau sang tiếng Anh:

**Loại bài**: ${lessonType}
**Độ khó**: ${lessonLevel}
**Văn bản tiếng Việt**: "${vietnameseText}"

**Yêu cầu**:
1. Dịch chính xác và tự nhiên sang tiếng Anh
2. Giữ nguyên cấu trúc câu và ý nghĩa
3. Sử dụng từ vựng phù hợp với độ khó ${lessonLevel}
4. Đảm bảo ngữ pháp chính xác
5. Trả về chỉ bản dịch tiếng Anh, không có giải thích thêm

**Bản dịch tiếng Anh**:`;

  console.log('📤 Gửi yêu cầu dịch tới Gemini API với Streaming');
  console.log('🌏 Region: asia-southeast1 (Singapore) - Tối ưu tốc độ');
  console.log('🔑 API Key:', process.env.GEMINI_API_KEY ? 'Đã cấu hình' : 'Chưa cấu hình');
  
  try {
    // Sử dụng streaming API để tăng tốc độ phản hồi
    const result = await generateContentWithTiming(prompt, 'gemini-1.5-flash', true);
    console.log(`⚡ Thời gian phản hồi streaming: ${result.duration}ms`);
    
    const translatedText = result.text.trim();
    console.log('✅ Dịch thành công:', translatedText);

    // Streaming thành công, trả về kết quả
    return res.status(200).json({ 
      translatedText,
      region: 'asia-southeast1',
      method: 'streaming',
      duration: result.duration
    });
    
  } catch (streamingError) {
    console.error('❌ Lỗi streaming API:', streamingError);
    console.log('🔄 Fallback to standard API...');
    
    try {
      // Fallback to standard API
      const fallbackResult = await generateContentWithTiming(prompt, 'gemini-1.5-flash', false);
      console.log(`⚡ Thời gian phản hồi fallback: ${fallbackResult.duration}ms`);
      
      const translatedText = fallbackResult.text.trim();
      console.log('✅ Dịch thành công với fallback:', translatedText);
      
      return res.status(200).json({ 
        translatedText,
        region: 'asia-southeast1',
        method: 'fallback',
        duration: fallbackResult.duration
      });
      
    } catch (fallbackError) {
      console.error('❌ Cả streaming và fallback đều thất bại:', fallbackError);
      return res.status(500).json({ error: 'Lỗi khi gọi Gemini API' });
    }
  }


}