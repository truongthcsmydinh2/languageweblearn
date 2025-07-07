import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Xóa tất cả các từ
    await db.execute('DELETE FROM terms');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting all vocab terms:', error);
    return res.status(500).json({ error: 'Failed to delete all vocab terms' });
  }
} 