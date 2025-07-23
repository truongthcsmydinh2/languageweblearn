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

      // Parse options và content từ group
      let parsedGroupOptions = null;
      let parsedGroupContent = null;
      
      try {
        if ((group as any).options && typeof (group as any).options === 'string' && (group as any).options.trim() !== '') {
          parsedGroupOptions = JSON.parse((group as any).options);
        } else if ((group as any).options) {
          parsedGroupOptions = (group as any).options;
        }
      } catch (parseError) {
        console.error('Error parsing group options:', group.id, parseError);
      }
      
      try {
        if ((group as any).content && typeof (group as any).content === 'string' && (group as any).content.trim() !== '') {
          parsedGroupContent = JSON.parse((group as any).content);
        } else if ((group as any).content) {
          parsedGroupContent = (group as any).content;
        }
      } catch (parseError) {
        console.error('Error parsing group content:', group.id, parseError);
      }

      // --- BỔ SUNG: Nếu là summary_completion và content là string, tự động chuyển thành mảng object ---
      if ((group.question_type === 'summary_completion' || group.question_type === 'note_completion') && typeof parsedGroupContent === 'string') {
        const regex = /(\_{3,}|\.{3,}|\s*_{2,}\s*|\s*\.\.\.\s*)/g;
        let lastIndex = 0;
        let match;
        let arr: any[] = [];
        while ((match = regex.exec(parsedGroupContent)) !== null) {
          if (match.index > lastIndex) {
            arr.push({ type: 'text', value: parsedGroupContent.slice(lastIndex, match.index) });
          }
          arr.push({ type: 'blank' });
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < parsedGroupContent.length) {
          arr.push({ type: 'text', value: parsedGroupContent.slice(lastIndex) });
        }
        parsedGroupContent = arr;
      }

      return {
        id: group.id,
        instructions: group.instructions,
        question_type: group.question_type,
        display_order: group.display_order,
        questions: questions,
        options: parsedGroupOptions,
        content: parsedGroupContent
      };
    });

    console.log('✅ Total questions found:', groups.reduce((sum, group) => sum + group.questions.length, 0));

    return res.status(200).json({
      questionGroups: groups
    });

  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}