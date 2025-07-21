import type { NextApiRequest, NextApiResponse } from 'next';

// Hàm lấy link audio từ HTML Cambridge Dictionary
async function getCambridgeAudioUrl(word: string): Promise<string | null> {
  // Thử tìm âm thanh cho cả cụm từ trước
  let searchWord = word.trim();
  
  const url = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(searchWord)}`;
  console.log(`Searching Cambridge for: "${searchWord}" at URL: ${url}`);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) {
    console.log(`Cambridge request failed with status: ${res.status}`);
    return null;
  }
  const html = await res.text();
  console.log(`Cambridge HTML length: ${html.length}`);
  
  // Kiểm tra xem có phải trang "word not found" rõ ràng không
  const notFoundIndicators = [
    'No results found',
    'Sorry, no results for',
    'We have no dictionary entry',
    'No dictionary results'
  ];
  
  const isNotFound = notFoundIndicators.some(indicator => html.toLowerCase().includes(indicator.toLowerCase()));
  if (isNotFound) {
    console.log(`Cambridge: Word "${searchWord}" explicitly not found`);
    return null;
  }

  // Regex tìm link audio mp3 (ưu tiên US, fallback UK)
  const usAudioMatch = html.match(/"([^"]*us_pron[^"]*\.mp3)"/i);
  const ukAudioMatch = html.match(/"([^"]*uk_pron[^"]*\.mp3)"/i);
  
  console.log(`US audio match: ${usAudioMatch ? usAudioMatch[1] : 'none'}`);
  console.log(`UK audio match: ${ukAudioMatch ? ukAudioMatch[1] : 'none'}`);
  
  const usAudio = usAudioMatch ? `https://dictionary.cambridge.org${usAudioMatch[1]}` : null;
  const ukAudio = ukAudioMatch ? `https://dictionary.cambridge.org${ukAudioMatch[1]}` : null;
  
  // Kiểm tra xem có phải URL âm thanh mặc định không (thường là cdo0318)
  const isDefaultAudio = (url: string) => url.includes('cdo0318') || url.includes('default');
  
  // Nếu tìm thấy âm thanh, kiểm tra xem có phải âm thanh mặc định không
  if (usAudio || ukAudio) {
    const foundUrl = usAudio || ukAudio;
    
    // Nếu là âm thanh mặc định, luôn reject để chuyển sang TTS
    if (isDefaultAudio(foundUrl)) {
      console.log(`Found default audio for "${searchWord}", using TTS instead`);
      return null;
    }
    
    console.log(`Found Cambridge audio for "${searchWord}": ${foundUrl}`);
    return foundUrl;
  }
  
  console.log(`No Cambridge audio found for "${searchWord}"`);
  
  // Nếu không tìm thấy và là cụm từ, thử tìm từ chính
  if (searchWord.includes(' ')) {
    const words = searchWord.split(' ');
    const mainWord = words[words.length - 1];
    console.log(`Trying main word: "${mainWord}"`);
    return await getCambridgeAudioUrl(mainWord);
  }
  
  return null;
}

// Hàm tạo âm thanh Text-to-Speech làm fallback
async function getTextToSpeechUrl(text: string): Promise<string> {
  // Sử dụng endpoint TTS nội bộ để tránh CORS
  const encodedText = encodeURIComponent(text);
  return `/api/tts?text=${encodedText}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { word } = req.query;
  if (!word || typeof word !== 'string') {
    res.status(400).json({ error: 'Thiếu tham số word' });
    return;
  }
  try {
    // Thử tìm âm thanh từ Cambridge Dictionary trước
    let audioUrl = await getCambridgeAudioUrl(word);
    let source = 'cambridge';
    
    // Nếu không tìm thấy, sử dụng Text-to-Speech làm fallback
    if (!audioUrl) {
      audioUrl = await getTextToSpeechUrl(word);
      source = 'tts';
    }
    
    res.status(200).json({ 
      audioUrl, 
      source,
      word: word
    });
  } catch (err) {
    console.error('Error in cambridge-audio API:', err);
    // Nếu có lỗi, vẫn cố gắng trả về TTS
    try {
      const fallbackUrl = await getTextToSpeechUrl(word);
      res.status(200).json({ 
        audioUrl: fallbackUrl, 
        source: 'tts',
        word: word,
        note: 'Fallback to TTS due to error'
      });
    } catch (fallbackErr) {
      res.status(500).json({ error: 'Không thể tạo âm thanh cho từ này' });
    }
  }
}