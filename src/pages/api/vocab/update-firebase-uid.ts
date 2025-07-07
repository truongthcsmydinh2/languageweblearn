// src/pages/api/vocab/update-firebase-uid.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firebase_uid } = req.body;
  
  if (!firebase_uid) {
    return res.status(400).json({ error: 'firebase_uid is required' });
  }

  try {
    // Cập nhật tất cả các từ vựng không có firebase_uid
    const [result] = await db.execute(
      'UPDATE terms SET firebase_uid = ? WHERE firebase_uid IS NULL',
      [firebase_uid]
    ) as any;
    
    return res.status(200).json({ 
      success: true,
      updatedCount: result.affectedRows
    });
  } catch (error) {
    console.error('Error updating firebase_uid:', error);
    return res.status(500).json({ 
      error: 'Failed to update firebase_uid',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}