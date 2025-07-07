import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { passage_id, score, total_questions, correct_answers, time_taken, answers } = req.body;

    const attempt = await prisma.ielts_reading_attempts.create({
      data: {
        firebase_uid,
        passage_id,
        score,
        total_questions,
        correct_answers,
        time_taken,
        answers: answers ? JSON.stringify(answers) : null
      }
    });

    return res.status(200).json({
      success: true,
      attempt_id: attempt.id
    });

  } catch (error) {
    console.error('Error submitting results:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 