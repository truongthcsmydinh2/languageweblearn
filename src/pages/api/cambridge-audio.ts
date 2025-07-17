import type { NextApiRequest, NextApiResponse } from 'next';

// Hàm lấy link audio từ HTML Cambridge Dictionary
async function getCambridgeAudioUrl(word: string): Promise<string | null> {
  const url = `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) return null;
  const html = await res.text();

  // Regex tìm link audio mp3 (ưu tiên US, fallback UK)
  // Cambridge thường có dạng: /media/english/us_pron/.../word.mp3
  const audioRegex = /\"(\/media\/english\/(us|uk)_pron\/[^"]+?\.mp3)\"/g;
  let match;
  let usAudio = null;
  let ukAudio = null;
  while ((match = audioRegex.exec(html)) !== null) {
    if (match[1].includes('/us_pron/')) {
      usAudio = 'https://dictionary.cambridge.org' + match[1];
      break;
    }
    if (!ukAudio && match[1].includes('/uk_pron/')) {
      ukAudio = 'https://dictionary.cambridge.org' + match[1];
    }
  }
  return usAudio || ukAudio || null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { word } = req.query;
  if (!word || typeof word !== 'string') {
    res.status(400).json({ error: 'Thiếu tham số word' });
    return;
  }
  try {
    const audioUrl = await getCambridgeAudioUrl(word);
    if (!audioUrl) {
      res.status(404).json({ error: 'Không tìm thấy audio Cambridge cho từ này' });
      return;
    }
    res.status(200).json({ audioUrl });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server hoặc Cambridge không phản hồi' });
  }
} 