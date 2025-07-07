import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, ids } = req.query;
    
    // Nếu có danh sách IDs được cung cấp
    if (ids) {
      const idArray = (ids as string).split(',').map(id => parseInt(id.trim()));
      const placeholders = idArray.map(() => '?').join(',');
      
      const [result] = await db.execute(
        `SELECT id, vocab, meaning, part_of_speech 
         FROM terms 
         WHERE id IN (${placeholders})`,
        [...idArray]
      );
      
      return res.status(200).json({ terms: result });
    }
    
    // Nếu chỉ có userId được cung cấp
    if (userId) {
      const [result] = await db.execute(
        `SELECT id, vocab, meaning, part_of_speech 
         FROM terms 
         WHERE firebase_uid = ?`,
        [userId]
      );
      
      return res.status(200).json({ terms: result });
    }
    
    return res.status(400).json({ message: 'Thiếu tham số người dùng hoặc danh sách ID' });
  } catch (error: any) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách từ vựng', error: error.message });
  }
} 