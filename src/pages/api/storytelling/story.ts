import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: 'Missing story id' });
    }
    // Lấy story
    const [storyRows] = await db.execute(
      `SELECT id, user_id, content, created_at, updated_at FROM stories WHERE id = ?`,
      [id]
    );
    if (!Array.isArray(storyRows) || storyRows.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }
    const story = storyRows[0];
    // Lấy các term liên quan
    const [terms] = await db.execute(
      `SELECT id, story_id, vocab_id, context, contextual_meaning, created_at FROM story_terms WHERE story_id = ?`,
      [id]
    );
    return res.status(200).json({ story, terms });
  } catch (error: any) {
    console.error('Error fetching story detail:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy chi tiết chuyện chêm', error: error.message });
  }
} 