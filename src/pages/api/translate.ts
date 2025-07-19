import type { NextApiRequest, NextApiResponse } from 'next';
import { Translate } from '@google-cloud/translate/build/src/v2';

interface TranslateRequest {
  text: string;
  targetLanguage: 'en' | 'vi';
  sourceLanguage?: string;
}

interface TranslateResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranslateResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, targetLanguage, sourceLanguage }: TranslateRequest = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Missing required fields: text, targetLanguage' });
    }

    // Initialize Google Translate client
    const translate = new Translate({
      key: process.env.CLOUD_TRANSLATION_API_KEY,
    });

    // Detect source language if not provided
    let detectedLang = sourceLanguage;
    if (!sourceLanguage) {
      const [detection] = await translate.detect(text);
      detectedLang = Array.isArray(detection) ? detection[0].language : detection.language;
    }

    // Skip translation if source and target are the same
    if (detectedLang === targetLanguage) {
      return res.status(200).json({
        translatedText: text,
        detectedSourceLanguage: detectedLang,
      });
    }

    // Perform translation
    const [translation] = await translate.translate(text, {
      from: detectedLang,
      to: targetLanguage,
    });

    return res.status(200).json({
      translatedText: translation,
      detectedSourceLanguage: detectedLang,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ 
      error: 'Translation failed. Please try again.' 
    });
  }
}