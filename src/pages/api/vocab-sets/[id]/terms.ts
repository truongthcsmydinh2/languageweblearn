import { db } from '@/lib/mysql';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      try {
        const [terms] = await db.execute(
          'SELECT * FROM terms WHERE vocab_set_id = ? ORDER BY created_at DESC',
          [id]
        );
        res.status(200).json(terms);
      } catch (error) {
        console.error('Error fetching terms:', error);
        res.status(500).json({ error: 'Error fetching terms' });
      }
      break;

    case 'POST':
      try {
        const { term, definition, example } = req.body;
        const [result] = await db.execute(
          'INSERT INTO terms (vocab_set_id, term, definition, example, created_at) VALUES (?, ?, ?, ?, NOW())',
          [id, term, definition, example]
        );
        res.status(201).json({ 
          id: result.insertId,
          message: 'Term added successfully' 
        });
      } catch (error) {
        console.error('Error adding term:', error);
        res.status(500).json({ error: 'Error adding term' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 