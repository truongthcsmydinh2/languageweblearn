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
      const { title, content, is_active, questions } = req.body;

      // Validate required fields
      if (!title || !content || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate questions
      for (const question of questions) {
        if (!question.question_text || !question.correct_answer) {
          return res.status(400).json({ error: 'All questions must have text and correct answer' });
        }
      }

      // Create passage with questions in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the passage
        const passage = await tx.ielts_reading_passages.create({
          data: {
            title,
            content,
            level: 'intermediate', // Default level
            category: '', // Empty category
            time_limit: 20, // Default time limit
            is_active
          }
        });

        // Create questions for the passage
        const createdQuestions = await Promise.all(
          questions.map((question: any) =>
            tx.ielts_reading_questions.create({
              data: {
                passage_id: passage.id,
                question_text: question.question_text,
                question_type: question.question_type || 'multiple_choice',
                options: question.options || [],
                correct_answer: question.correct_answer,
                explanation: question.explanation || '',
                order_index: question.order_index || 1
              }
            })
          )
        );

        return {
          passage,
          questions: createdQuestions
        };
      });

      return res.status(201).json({
        message: 'Passage and questions created successfully',
        passage: result.passage,
        questions: result.questions
      });

    } catch (error) {
      console.error('Error creating passage with questions:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 