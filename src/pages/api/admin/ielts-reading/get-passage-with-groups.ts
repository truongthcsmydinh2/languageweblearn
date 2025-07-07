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

  if (req.method === 'GET') {
    try {
      const { passage_id } = req.query;

      if (!passage_id) {
        return res.status(400).json({ error: 'Thiếu passage_id' });
      }

      // Lấy passage với question groups và questions
      const passage = await prisma.ielts_reading_passages.findUnique({
        where: { id: parseInt(passage_id as string) },
        include: {
          question_groups: {
            include: {
              questions: {
                orderBy: {
                  order_index: 'asc'
                }
              }
            },
            orderBy: {
              display_order: 'asc'
            }
          }
        }
      });

      if (!passage) {
        return res.status(404).json({ error: 'Passage không tồn tại' });
      }

      // Format dữ liệu trả về
      const formattedPassage = {
        id: passage.id,
        title: passage.title,
        content: passage.content,
        level: passage.level,
        category: passage.category,
        time_limit: passage.time_limit,
        is_active: passage.is_active,
        created_at: passage.created_at,
        updated_at: passage.updated_at,
        groups: passage.question_groups.map(group => ({
          id: group.id,
          instructions: group.instructions,
          question_type: group.question_type,
          display_order: group.display_order,
          questions: group.questions.map(question => ({
            id: question.id,
            question_text: question.question_text,
            question_type: question.question_type,
            options: question.options,
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            note: question.note,
            order_index: question.order_index
          }))
        }))
      };

      return res.status(200).json({
        success: true,
        passage: formattedPassage
      });

    } catch (error) {
      console.error('❌ Lỗi khi lấy passage:', error);
      return res.status(500).json({ 
        error: 'Lỗi server',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 