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
  const questionId = parseInt(id as string);

  if (!questionId || isNaN(questionId)) {
    return res.status(400).json({ error: 'Invalid question ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { question_text, question_type, options, correct_answer, explanation, note, order_index } = req.body;

      const question = await prisma.ielts_reading_questions.update({
        where: { id: questionId },
        data: {
          question_text,
          question_type,
          options: options || null,
          correct_answer,
          explanation,
          note,
          order_index
        }
      });

      return res.status(200).json({
        question
      });

    } catch (error) {
      console.error('Error updating question:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.ielts_reading_questions.delete({
        where: { id: questionId }
      });

      return res.status(200).json({
        success: true
      });

    } catch (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 