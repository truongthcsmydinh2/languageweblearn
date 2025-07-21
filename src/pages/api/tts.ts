import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = req.query;
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Thiếu tham số text' });
  }

  try {
    // Sử dụng Google TTS với User-Agent để tránh bị chặn
    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`;
    
    console.log(`Fetching TTS for: "${text}" from: ${ttsUrl}`);
    
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'audio/mpeg,audio/*,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://translate.google.com/'
      }
    });
    
    if (!response.ok) {
      console.log(`TTS request failed with status: ${response.status}`);
      return res.status(500).json({ error: 'Không thể tạo âm thanh' });
    }
    
    const audioBuffer = await response.arrayBuffer();
    
    if (audioBuffer.byteLength === 0) {
      console.log('TTS returned empty audio');
      return res.status(500).json({ error: 'Âm thanh trống' });
    }
    
    console.log(`TTS audio size: ${audioBuffer.byteLength} bytes`);
    
    // Trả về audio với headers phù hợp
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 giờ
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.send(Buffer.from(audioBuffer));
    
  } catch (error) {
    console.error('Error in TTS API:', error);
    return res.status(500).json({ error: 'Lỗi server khi tạo âm thanh' });
  }
}