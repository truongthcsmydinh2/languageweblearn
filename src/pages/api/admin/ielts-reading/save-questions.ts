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
      const { passage_id, groups } = req.body;

      if (!passage_id) {
        return res.status(400).json({ error: 'Thiếu passage_id' });
      }

      if (!groups || !Array.isArray(groups)) {
        return res.status(400).json({ error: 'Thiếu groups hoặc groups không phải array' });
      }

      // Validate passage exists
      const passage = await prisma.ielts_reading_passages.findUnique({
        where: { id: parseInt(passage_id) }
      });

      if (!passage) {
        return res.status(404).json({ error: 'Passage không tồn tại' });
      }

      // Chuẩn hóa key cho từng câu hỏi
      const normalizeQuestion = (q: any) => {
        // Sửa các key bị cắt hoặc viết sai
        const questionText = q.questionText || q.questiontext || q.questio || q.question_text || '';
        const correctAnswer = q.correctAnswer || q.correctanswer || q.correct_answer || '';
        return {
          ...q,
          questionText,
          correctAnswer
        };
      };

      // Validate groups structure
      for (const group of groups) {
        if (!group.instructions || !group.questionType || !Array.isArray(group.questions)) {
          return res.status(400).json({ error: 'Cấu trúc group không hợp lệ' });
        }
        for (const question of group.questions) {
          const normQ = normalizeQuestion(question);
          if (!normQ.questionText || !normQ.correctAnswer) {
            return res.status(400).json({ error: 'Cấu trúc question không hợp lệ' });
          }
        }
      }

      // Xóa dữ liệu cũ trước khi tạo mới
      await prisma.$transaction(async (tx) => {
        // Xóa tất cả question groups cũ (cascade sẽ tự động xóa questions)
        await tx.ielts_reading_question_groups.deleteMany({
          where: { passage_id: parseInt(passage_id) }
        });

        // Tạo các group mới
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          
          // Tạo question group
          const createdGroup = await tx.ielts_reading_question_groups.create({
            data: {
              instructions: group.instructions,
              question_type: group.questionType,
              display_order: i + 1,
              passage_id: parseInt(passage_id)
            }
          });

          // Tạo các câu hỏi cho group này
          const questionsToCreate = group.questions.map((question: any, index: number) => {
            const normQ = normalizeQuestion(question);
            return {
              group_id: createdGroup.id,
              question_text: normQ.questionText,
              question_type: group.questionType,
              correct_answer: normQ.correctAnswer,
              options: normQ.options || null,
              explanation: normQ.explanation || null,
              note: normQ.note || null,
              order_index: index + 1
            };
          });

          // Tạo tất cả câu hỏi trong group
          await tx.ielts_reading_questions.createMany({
            data: questionsToCreate
          });
        }
      });

      return res.status(201).json({
        message: 'Câu hỏi đã được lưu thành công',
        passage_id: passage_id,
        groups_count: groups.length
      });

    } catch (error) {
      console.error('❌ Lỗi khi lưu câu hỏi:', error);
      return res.status(500).json({ 
        error: 'Lỗi server',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 