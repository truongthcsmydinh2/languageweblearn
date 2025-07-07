import { db } from '@/lib/mysql';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      try {
        const [sets] = await db.execute(
          'SELECT * FROM vocab_sets WHERE id = ?',
          [id]
        );
        
        if (!sets || (sets as any[]).length === 0) {
          return res.status(404).json({ error: 'Vocab set not found' });
        }
        
        res.status(200).json(sets[0]);
      } catch (error) {
        console.error('Error fetching vocab set:', error);
        res.status(500).json({ error: 'Error fetching vocab set' });
      }
      break;

    case 'PUT':
      try {
        const { title, description } = req.body;
        await db.execute(
          'UPDATE vocab_sets SET title = ?, description = ? WHERE id = ?',
          [title, description, id]
        );
        res.status(200).json({ message: 'Vocab set updated successfully' });
      } catch (error) {
        console.error('Error updating vocab set:', error);
        res.status(500).json({ error: 'Error updating vocab set' });
      }
      break;

    case 'DELETE':
      try {
        await db.execute('DELETE FROM vocab_sets WHERE id = ?', [id]);
        res.status(200).json({ message: 'Vocab set deleted successfully' });
      } catch (error) {
        console.error('Error deleting vocab set:', error);
        res.status(500).json({ error: 'Error deleting vocab set' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 