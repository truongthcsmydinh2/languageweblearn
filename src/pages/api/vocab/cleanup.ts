import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Xóa tất cả các bản ghi với vocab rỗng
    await db.execute("DELETE FROM terms WHERE vocab = '' OR vocab IS NULL");
    
    return res.status(200).json({ success: true, message: "Cleaned up empty vocab entries" });
  } catch (error) {
    console.error('Error cleaning up vocab terms:', error);
    return res.status(500).json({ error: 'Failed to clean up vocab terms' });
  }
} 