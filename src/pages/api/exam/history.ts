import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

interface ExamHistory {
  id: number;
  firebase_uid: string;
  exam_date: Date;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  accuracy: number;
  grade: string;
  settings: any;
  details: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const firebase_uid = req.headers.firebase_uid as string;
  
  if (!firebase_uid) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT * FROM exam_history WHERE firebase_uid = ? ORDER BY exam_date DESC',
        [firebase_uid]
      );
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching exam history:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { totalQuestions, correctAnswers, wrongAnswers, accuracy, grade, settings, details } = req.body;
      
      const result = await query(
        'INSERT INTO exam_history (firebase_uid, exam_date, total_questions, correct_answers, wrong_answers, accuracy, grade, settings, details) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?)',
        [firebase_uid, totalQuestions, correctAnswers, wrongAnswers, accuracy, grade, JSON.stringify(settings), JSON.stringify(details)]
      );
      
      return res.status(201).json({ id: result.insertId });
    } catch (error) {
      console.error('Error saving exam history:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 