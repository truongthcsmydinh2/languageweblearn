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

  if (req.method === 'GET') {
    try {
      const questions = await prisma.ielts_reading_questions.findMany({
        where: {
          passage_id: passageId
        },
        orderBy: {
          order_index: 'asc'
        }
      });

      const formattedQuestions = questions.map(question => ({
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        order_index: question.order_index
      }));

      return res.status(200).json({
        questions: formattedQuestions
      });

    } catch (error) {
      console.error('Error fetching questions:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 