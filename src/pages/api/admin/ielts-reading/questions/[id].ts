import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Bỏ qua kiểm tra xác thực và quyền admin
  
  const { id } = req.query;
  const passageId = parseInt(id as string);
  
  console.log('[Questions API] Received request for passage ID:', id, 'parsed as:', passageId);

  if (isNaN(passageId)) {
    console.log('[Questions API] Invalid passage ID');
    return res.status(400).json({ error: 'Invalid passage ID' });
  }

  if (req.method === 'GET') {
    try {
      console.log('[Questions API] Querying question groups for passage ID:', passageId);
      
      // Lấy tất cả nhóm câu hỏi và câu hỏi của bài đọc
      const questionGroups = await prisma.ielts_reading_question_groups.findMany({
        where: { passage_id: passageId },
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
      });
      
      console.log('[Questions API] Found question groups:', questionGroups.length);

      // Chuyển đổi dữ liệu và bỏ qua trường instructions
      const formattedGroups = questionGroups.map(group => ({
        id: group.id,
        content: group.instructions, // Sử dụng instructions làm content
        questionType: group.question_type,
        display_order: group.display_order,
        questions: group.questions.map(question => ({
          id: question.id,
          question_text: question.question_text,
          question_type: question.question_type,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          note: question.note,
          order_index: question.order_index,
          group_id: question.group_id,
          passage_id: question.passage_id
        }))
      }));

      return res.status(200).json({
        groups: formattedGroups
      });

    } catch (error) {
      console.error('Error fetching questions:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { questions } = req.body;

      // Cập nhật thứ tự câu hỏi
      for (const question of questions) {
        await prisma.ielts_reading_questions.update({
          where: { id: question.id },
          data: { order_index: question.order_index }
        });
      }

      return res.status(200).json({
        message: 'Questions order updated successfully'
      });

    } catch (error) {
      console.error('Error updating question order:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}