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
    const cloudTranslationRes = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${process.env.CLOUD_TRANSLATION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: englishText,
        source: 'en',
        target: 'vi',
        format: 'text'
      })
    });

    if (!cloudTranslationRes.ok) {
      return res.status(500).json({ error: 'Cloud Translation API lỗi', detail: await cloudTranslationRes.text() });
    }

    const cloudData = await cloudTranslationRes.json();
    const translatedText = cloudData?.data?.translations?.[0]?.translatedText || '';
    
    if (!translatedText) {
      return res.status(500).json({ error: 'Cloud Translation trả về rỗng' });
    }

    return res.status(200).json({
      success: true,
      translatedText,
      originalText: englishText,
      method: 'cloud_translation'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi server', details: error instanceof Error ? error.message : 'Unknown error' });
  }
} 