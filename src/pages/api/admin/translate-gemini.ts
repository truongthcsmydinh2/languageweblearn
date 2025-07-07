import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { englishText } = req.body;
  if (!englishText) {
    return res.status(400).json({ error: 'Thiếu văn bản tiếng Anh' });
  }

  try {
    // Tạo prompt cho Gemini: Dịch từ tiếng Anh sang tiếng Việt và trả về loại từ
    const prompt = `Dịch sang tiếng Việt: "${englishText}"
Yêu cầu:
1. Dịch tự nhiên, chính xác.
2. Xác định loại từ (part of speech) và trả về bằng tiếng Anh (e.g. noun, verb, adjective, adverb, phrasal verb, noun phrase, ...).
3. Chỉ trả về kết quả dưới dạng JSON với 2 trường: vi (nghĩa tiếng Việt), pos (loại từ, tiếng Anh).
Ví dụ: {"vi": "bằng tốt nghiệp", "pos": "noun"}`;

    console.log('📤 Gửi yêu cầu dịch tới Gemini API');
    console.log('🔑 API Key:', process.env.GEMINI_API_KEY ? 'Đã cấu hình' : 'Chưa cấu hình');
    
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048, // Tăng giới hạn token
        }
      })
    });

    console.log('📊 Response status:', geminiRes.status);
    console.log('📊 Response headers:', Object.fromEntries(geminiRes.headers.entries()));

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('❌ Gemini API error:', errorText);
      console.error('❌ Status:', geminiRes.status);
      return res.status(500).json({ error: 'Lỗi Gemini API', detail: errorText });
    }

    const geminiData = await geminiRes.json();
    console.log('📥 Gemini response received');
    console.log('📄 Raw response:', JSON.stringify(geminiData).substring(0, 500) + '...');
    
    let translatedText = '';
    let partOfSpeech = '';
    
    try {
      let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) rawText = geminiData?.candidates?.[0]?.content?.text || '';
      if (!rawText) rawText = geminiData?.text || '';
      if (!rawText) rawText = geminiData?.content || '';
      // Thử parse JSON
      try {
        const json = JSON.parse(rawText);
        translatedText = json.vi || '';
        partOfSpeech = json.pos || '';
      } catch {
        // Nếu không phải JSON, fallback như cũ
        translatedText = rawText;
      }
      // Kiểm tra finishReason
      const finishReason = geminiData?.candidates?.[0]?.finishReason;
      console.log('🏁 Finish reason:', finishReason);
      if (finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ Response bị cắt do vượt quá giới hạn token');
      }
      console.log('📝 Extracted text:', translatedText.substring(0, 200) + '...');
      if (partOfSpeech) console.log('📝 Extracted part of speech:', partOfSpeech);
    } catch (parseError) {
      console.error('❌ Lỗi parse response:', parseError);
      console.error('❌ Raw response:', geminiData);
      return res.status(500).json({ error: 'Lỗi parse response từ Gemini', detail: String(parseError) });
    }

    if (!translatedText) {
      console.error('❌ Không tìm thấy text trong response');
      console.error('❌ Full response:', JSON.stringify(geminiData));
      
      // Fallback: thử dịch với prompt đơn giản hơn
      console.log('🔄 Thử lại với prompt đơn giản hơn...');
      const simplePrompt = `Translate to Vietnamese: "${englishText}"`;
      
      const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY || ''
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: simplePrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          }
        })
      });
      
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        translatedText = fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('✅ Fallback thành công:', translatedText.substring(0, 100) + '...');
      } else {
        return res.status(500).json({ error: 'Gemini không trả về bản dịch', detail: JSON.stringify(geminiData) });
      }
    }

    // Làm sạch text (loại bỏ các phần không cần thiết)
    const cleanText = translatedText
      .replace(/^Bản dịch tiếng Anh:\s*/i, '')
      .replace(/^Translation:\s*/i, '')
      .trim();

    console.log('✅ Dịch thành công:', cleanText.substring(0, 100) + '...');

    return res.status(200).json({
      success: true,
      translatedText: cleanText,
      originalText: englishText,
      partOfSpeech: partOfSpeech
    });

  } catch (error) {
    console.error('❌ Lỗi khi dịch với Gemini:', error);
    return res.status(500).json({ 
      error: 'Lỗi server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 