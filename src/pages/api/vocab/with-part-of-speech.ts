import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Lấy firebase_uid từ header
    const firebase_uid = req.headers.firebase_uid as string;
    
    if (!firebase_uid) {
      return res.status(401).json({ error: 'Unauthorized - Missing firebase_uid' });
    }

    // Lấy danh sách từ vựng có part_of_speech
    const [terms] = await db.execute(
      'SELECT id, vocab, meanings, part_of_speech FROM terms WHERE firebase_uid = ? AND part_of_speech IS NOT NULL',
      [firebase_uid]
    );

    return res.status(200).json(terms);
  } catch (error) {
    console.error('Error fetching terms with part of speech:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 