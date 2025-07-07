import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const passageId = parseInt(id as string);

  if (!passageId || isNaN(passageId)) {
    return res.status(400).json({ error: 'Invalid passage ID' });
  }

  try {
    const questions = await prisma.ielts_reading_questions.findMany({
      where: {
        passage_id: passageId
      },
      orderBy: {
        order_index: 'asc'
      }
    });

    const formattedQuestions = questions.map(question => {
      let parsedOptions = null;
      
      try {
        if (question.options) {
          parsedOptions = JSON.parse(question.options as string);
        }
      } catch (parseError) {
        console.error('Error parsing options for question:', question.id, parseError);
        // Nếu parse lỗi, sử dụng options gốc hoặc null
        parsedOptions = question.options;
      }
      
      return {
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: parsedOptions,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        order_index: question.order_index
      };
    });

    return res.status(200).json({
      questions: formattedQuestions
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 