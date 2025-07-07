import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { termIds } = req.body;
  
  if (!termIds || !Array.isArray(termIds) || termIds.length === 0) {
    return res.status(400).json({ error: 'Term IDs array is required' });
  }

  try {
    // Chuẩn bị tham số cho truy vấn IN (?)
    const placeholders = termIds.map(() => '?').join(',');
    
    // Xóa nhiều từ vựng cùng lúc bằng ID
    const [result] = await db.execute(
      `DELETE FROM terms WHERE id IN (${placeholders})`,
      termIds
    );
    
    return res.status(200).json({ 
      success: true,
      deletedCount: result.affectedRows
    });
  } catch (error) {
    console.error('Error deleting multiple terms:', error);
    return res.status(500).json({ 
      error: 'Failed to delete terms',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 