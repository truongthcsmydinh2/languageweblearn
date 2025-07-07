import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const firebase_uid = req.headers.firebase_uid as string;
  
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user is admin
  const user = await prisma.users.findFirst({
    where: { firebase_uid }
  });

  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.query;
  const passageId = parseInt(id as string);

  if (!passageId || isNaN(passageId)) {
    return res.status(400).json({ error: 'Invalid passage ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { title, content, level, category, time_limit, is_active } = req.body;

      const passage = await prisma.ielts_reading_passages.update({
        where: { id: passageId },
        data: {
          title,
          content,
          level,
          category,
          time_limit,
          is_active
        }
      });

      return res.status(200).json({
        passage
      });

    } catch (error) {
      console.error('Error updating passage:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.ielts_reading_passages.delete({
        where: { id: passageId }
      });

      return res.status(200).json({
        success: true
      });

    } catch (error) {
      console.error('Error deleting passage:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 