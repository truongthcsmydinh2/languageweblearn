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

  if (req.method === 'POST') {
    try {
      const { passage_id, question_text, question_type, options, correct_answer, explanation, note, order_index } = req.body;

      const question = await prisma.ielts_reading_questions.create({
        data: {
          passage_id,
          question_text,
          question_type,
          options: options || null,
          correct_answer,
          explanation,
          note,
          order_index
        }
      });

      return res.status(201).json({
        question
      });

    } catch (error) {
      console.error('Error creating question:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 