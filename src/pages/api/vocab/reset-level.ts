import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { termId, type } = req.body;
  if (!type || !['en', 'vi', 'all'].includes(type)) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  try {
    const conn = await connectToDatabase();
    const now = Date.now();
    const nowDate = new Date();
    if (type === 'all' && !termId) {
      // Reset tất cả các từ
      await conn.query(
        `UPDATE terms SET level_en = 0, level_vi = 0, review_time_en = ?, review_time_vi = ?, last_review_en = ?, last_review_vi = ?, created_at = ?`,
        [nowDate, nowDate, now, now, nowDate]
      );
    } else if (type === 'all' && termId) {
      // Reset một từ
      await conn.query(
        `UPDATE terms SET level_en = 0, level_vi = 0, review_time_en = ?, review_time_vi = ?, last_review_en = ?, last_review_vi = ?, created_at = ? WHERE id = ?`,
        [nowDate, nowDate, now, now, nowDate, termId]
      );
    } else {
      const levelField = type === 'en' ? 'level_en' : 'level_vi';
      const reviewTimeField = type === 'en' ? 'review_time_en' : 'review_time_vi';
      const lastReviewField = type === 'en' ? 'last_review_en' : 'last_review_vi';
      await conn.query(
        `UPDATE terms SET ${levelField} = 0, ${reviewTimeField} = ?, ${lastReviewField} = ?, created_at = ? WHERE id = ?`,
        [nowDate, now, nowDate, termId]
      );
    }
    conn.release();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('RESET-LEVEL ERROR:', err);
    return res.status(500).json({ error: 'Database error', details: err instanceof Error ? err.message : String(err) });
  }
} 