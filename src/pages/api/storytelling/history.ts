import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }
    const [rows] = await db.execute(
      `SELECT id, content, created_at, updated_at FROM stories WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return res.status(200).json({ stories: rows });
  } catch (error: any) {
    console.error('Error fetching story history:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy lịch sử chuyện chêm', error: error.message });
  }
} 