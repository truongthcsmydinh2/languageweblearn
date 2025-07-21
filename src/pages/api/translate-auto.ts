import type { NextApiRequest, NextApiResponse } from 'next';
import { Translate } from '@google-cloud/translate/build/src/v2';

interface AutoTranslateRequest {
  text: string;
}

interface AutoTranslateResponse {
  translatedText: string;
  detectedSourceLanguage: string;
  targetLanguage: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AutoTranslateResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text }: AutoTranslateRequest = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }

    // Initialize Google Translate client
    const translate = new Translate({
      key: process.env.CLOUD_TRANSLATION_API_KEY,
    });

    // Detect source language
    const [detection] = await translate.detect(text);
    const detectedLang = Array.isArray(detection) ? detection[0].language : detection.language;
    
    // Determine target language based on detected language
    let targetLang: string;
    if (detectedLang === 'vi') {
      targetLang = 'en'; // Vietnamese -> English
    } else if (detectedLang === 'en') {
      targetLang = 'vi'; // English -> Vietnamese
    } else {
      // For other languages, default to Vietnamese
      targetLang = 'vi';
    }

    // Skip translation if source and target are the same
    if (detectedLang === targetLang) {
      return res.status(200).json({
        translatedText: text,
        detectedSourceLanguage: detectedLang,
        targetLanguage: targetLang,
      });
    }

    // Perform translation
    const [translation] = await translate.translate(text, {
      from: detectedLang,
      to: targetLang,
    });

    return res.status(200).json({
      translatedText: translation,
      detectedSourceLanguage: detectedLang,
      targetLanguage: targetLang,
    });
  } catch (error) {
    console.error('Auto translation error:', error);
    return res.status(500).json({ 
      error: 'Auto translation failed. Please try again.' 
    });
  }
}