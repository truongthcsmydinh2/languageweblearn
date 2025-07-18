import type { NextApiRequest, NextApiResponse } from 'next';
import { generateContentWithTiming, generateJSONContent } from '@/lib/gemini';
import { safeJsonParse } from '@/utils/jsonUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { englishText } = req.body;
  if (!englishText) {
    return res.status(400).json({ error: 'Thiếu văn bản tiếng Anh' });
  }

  try {
    console.log('🧠 Sử dụng Gemini API với Streaming (asia-southeast1)');
    return await translateWithGeminiStreamingAPI(englishText, res);
  } catch (error) {
    console.error('❌ Lỗi khi dịch:', error);
    return res.status(500).json({ 
      error: 'Lỗi server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Hàm dịch bằng Gemini API với Streaming (tối ưu tốc độ)
async function translateWithGeminiStreamingAPI(englishText: string, res: NextApiResponse) {
  // Tạo prompt cho Gemini: Dịch từ tiếng Anh sang tiếng Việt và trả về loại từ
  const prompt = `Dịch sang tiếng Việt: "${englishText}"
Yêu cầu:
1. Dịch tự nhiên, chính xác.
2. Xác định loại từ (part of speech) và trả về bằng tiếng Anh (e.g. noun, verb, adjective, adverb, phrasal verb, noun phrase, ...).
3. Chỉ trả về kết quả dưới dạng JSON với 2 trường: vi (nghĩa tiếng Việt), pos (loại từ, tiếng Anh).
Ví dụ: {"vi": "bằng tốt nghiệp", "pos": "noun"}`;

  console.log('📤 Gửi yêu cầu dịch tới Gemini API với Streaming');
  console.log('🔑 API Key:', process.env.GEMINI_API_KEY ? 'Đã cấu hình' : 'Chưa cấu hình');
  console.log('🌏 Region: asia-southeast1 (Singapore) - Tối ưu tốc độ');
  
  try {
    // Sử dụng streaming API để tăng tốc độ phản hồi
    const result = await generateContentWithTiming(prompt, 'gemini-1.5-flash', true);
    
    console.log(`⚡ Thời gian phản hồi: ${result.duration}ms (cải thiện từ ~6s xuống ~${Math.round(result.duration/1000)}s)`);
    
    let translatedText = '';
    let partOfSpeech = '';
    
    // Parse JSON từ streaming response
    const jsonData = safeJsonParse(result.text);
    if (jsonData) {
      translatedText = jsonData.vi || '';
      partOfSpeech = jsonData.pos || '';
    } else {
      // Fallback: thử parse thủ công
      translatedText = result.text;
      console.warn('⚠️ Không parse được JSON, sử dụng text thô');
    }

    console.log('📥 Gemini streaming response received');
    console.log('📝 Extracted text:', translatedText.substring(0, 200) + '...');
    if (partOfSpeech) console.log('📝 Extracted part of speech:', partOfSpeech);

    if (!translatedText) {
      console.error('❌ Không tìm thấy text trong streaming response');
      
      // Fallback: thử dịch với prompt đơn giản hơn
      console.log('🔄 Thử lại với prompt đơn giản hơn...');
      const simplePrompt = `Translate to Vietnamese: "${englishText}"`;
      
      try {
        const fallbackResult = await generateContentWithTiming(simplePrompt, 'gemini-1.5-flash', true);
        translatedText = fallbackResult.text;
        console.log('✅ Fallback streaming thành công:', translatedText.substring(0, 100) + '...');
      } catch (fallbackError) {
        console.error('❌ Fallback streaming thất bại:', fallbackError);
        return res.status(500).json({ error: 'Gemini không trả về bản dịch', detail: String(fallbackError) });
      }
    }

    // Làm sạch text (loại bỏ các phần không cần thiết)
    const cleanText = translatedText
      .replace(/^Bản dịch tiếng Anh:\s*/i, '')
      .replace(/^Translation:\s*/i, '')
      .replace(/^```json\s*/i, '')  // Loại bỏ ```json ở đầu
      .replace(/^```\s*/i, '')      // Loại bỏ ``` ở đầu
      .replace(/\s*```\s*$/i, '')   // Loại bỏ ``` ở cuối
      .replace(/^```\s*/i, '')      // Loại bỏ ``` ở đầu (thêm lần nữa để đảm bảo)
      .replace(/\s*```\s*$/i, '')   // Loại bỏ ``` ở cuối (thêm lần nữa để đảm bảo)
      .trim();

    console.log(`✅ Dịch streaming thành công trong ${result.duration}ms:`, cleanText.substring(0, 100) + '...');

    return res.status(200).json({
      success: true,
      translatedText: cleanText,
      originalText: englishText,
      partOfSpeech: partOfSpeech,
      method: 'gemini-streaming',
      responseTime: result.duration,
      region: 'asia-southeast1'
    });
    
  } catch (streamingError) {
    console.error('❌ Lỗi streaming API:', streamingError);
    
    // Fallback to standard API nếu streaming thất bại
    console.log('🔄 Fallback to standard API...');
    try {
      const fallbackResult = await generateContentWithTiming(prompt, 'gemini-1.5-flash', false);
      
      let translatedText = '';
      let partOfSpeech = '';
      
      const jsonData = safeJsonParse(fallbackResult.text);
      if (jsonData) {
        translatedText = jsonData.vi || '';
        partOfSpeech = jsonData.pos || '';
      } else {
        translatedText = fallbackResult.text;
      }
      
      const cleanText = translatedText
        .replace(/^Bản dịch tiếng Anh:\s*/i, '')
        .replace(/^Translation:\s*/i, '')
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
      
      console.log(`✅ Fallback standard API thành công trong ${fallbackResult.duration}ms`);
      
      return res.status(200).json({
        success: true,
        translatedText: cleanText,
        originalText: englishText,
        partOfSpeech: partOfSpeech,
        method: 'gemini-standard-fallback',
        responseTime: fallbackResult.duration,
        region: 'asia-southeast1'
      });
      
    } catch (fallbackError) {
      console.error('❌ Cả streaming và standard API đều thất bại:', fallbackError);
      return res.status(500).json({ 
        error: 'Lỗi Gemini API', 
        detail: String(fallbackError),
        streamingError: String(streamingError)
      });
    }
  }
}