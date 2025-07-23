import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { text, targetLanguage = 'vi' } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${process.env.CLOUD_TRANSLATION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        format: 'text'
      })
    });

    const data = await response.json();
    
    if (data.data && data.data.translations && data.data.translations[0]) {
      return res.status(200).json({
        translatedText: data.data.translations[0].translatedText,
        detectedSourceLanguage: data.data.translations[0].detectedSourceLanguage
      });
    }

    return res.status(500).json({ message: 'Translation failed' });
  } catch (error) {
    console.error('Error calling Translation API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}