import { db } from '@/lib/mysql';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { userId } = req.query;
        const [sets] = await db.execute(
          'SELECT * FROM vocab_sets WHERE firebase_uid = ? ORDER BY created_at DESC',
          [userId]
        );
        res.status(200).json(sets);
      } catch (error) {
        console.error('Error fetching vocab sets:', error);
        res.status(500).json({ error: 'Error fetching vocab sets' });
      }
      break;

    case 'POST':
      try {
        const { userId, title, description } = req.body;
        const [result] = await db.execute(
          'INSERT INTO vocab_sets (firebase_uid, name, description, created_at) VALUES (?, ?, ?, NOW())',
          [userId, title, description]
        ) as any;
        res.status(201).json({ 
          id: result.insertId,
          message: 'Vocab set created successfully' 
        });
      } catch (error) {
        console.error('Error creating vocab set:', error);
        res.status(500).json({ error: 'Error creating vocab set' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 