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
    console.log('🔍 Fetching questions for passage ID:', passageId);
    
    // Lấy passage với groups và questions
    const passage = await prisma.ielts_reading_passages.findUnique({
      where: { id: passageId },
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
      console.log('❌ Passage not found:', passageId);
      return res.status(404).json({ error: 'Passage not found' });
    }

    console.log('✅ Passage found:', passage.title);
    console.log('📊 Groups count:', passage.question_groups.length);

    // Chuyển đổi question_groups sang định dạng mới
    const groups = passage.question_groups.map(group => {
      const questions = group.questions.map(question => {
        let parsedOptions = null;
        
        try {
          if (question.options && typeof question.options === 'string' && question.options.trim() !== '') {
            // Kiểm tra xem chuỗi có phải là JSON hợp lệ không
            if (question.options.startsWith('[') && question.options.endsWith(']')) {
              parsedOptions = JSON.parse(question.options);
            } else {
              // Nếu không phải JSON array, có thể là chuỗi đơn hoặc định dạng khác
              parsedOptions = [question.options];
            }
          }
        } catch (parseError) {
          console.error('Error parsing options for question:', question.id, parseError);
          // Nếu không parse được, sử dụng options như một mảng với một phần tử
          if (question.options && typeof question.options === 'string') {
            parsedOptions = [question.options];
          } else {
            parsedOptions = [];
          }
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

      return {
        id: group.id,
        instructions: group.instructions,
        question_type: group.question_type,
        display_order: group.display_order,
        questions: questions
      };
    });

    console.log('✅ Total questions found:', groups.reduce((sum, group) => sum + group.questions.length, 0));

    return res.status(200).json({
      groups: groups
    });

  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 