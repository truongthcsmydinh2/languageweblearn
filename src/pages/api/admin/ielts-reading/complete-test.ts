import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Bỏ qua kiểm tra xác thực và quyền admin
  
  if (req.method === 'POST') {
    try {
      const { title, description, is_active, passages, all_answers } = req.body;

      // Tạo bản ghi đề IELTS Reading
      const result = await prisma.$transaction(async (tx) => {
        // Tạo đề Reading
        let testData = {
          title,
          description: description || '',
          is_active: is_active !== undefined ? is_active : true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Tạo một mảng để lưu các câu hỏi được tạo
        const createdQuestions = [];
        
        // Tạo các passages và questions liên quan
        for (const passageData of passages) {
          if (!passageData.title || !passageData.title.trim()) {
            continue; // Bỏ qua passages không có tiêu đề
          }

          // Tạo passage
          const passage = await tx.ielts_reading_passages.create({
            data: {
              title: passageData.title,
              content: passageData.content || '',
              level: 'intermediate', // Mặc định
              category: title, // Sử dụng tiêu đề đề thi làm category
              time_limit: 20, // Mặc định 20 phút
              is_active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          });

          // Tạo các nhóm câu hỏi và câu hỏi
          if (passageData.groups && Array.isArray(passageData.groups)) {
            for (let i = 0; i < passageData.groups.length; i++) {
              const groupData = passageData.groups[i];
              
              // Tạo nhóm câu hỏi
              const questionGroup = await tx.ielts_reading_question_groups.create({
                data: {
                  instructions: groupData.content || '', // Sử dụng content làm instructions trong DB
                  question_type: groupData.questionType || 'multiple_choice',
                  display_order: i + 1,
                  passage_id: passage.id,
                  created_at: new Date(),
                  updated_at: new Date()
                }
              });

              // Tạo các câu hỏi
              if (groupData.questions && Array.isArray(groupData.questions)) {
                for (const questionData of groupData.questions) {
                  const orderIndex = questionData.orderIndex || 1;
                  
                  // Tìm đáp án đúng từ all_answers
                  let correctAnswer = '';
                  if (all_answers && Array.isArray(all_answers)) {
                    const answerObj = all_answers.find(a => a.order_index === orderIndex || a.question_number === orderIndex.toString());
                    if (answerObj) {
                      correctAnswer = answerObj.answer || '';
                    }
                  }
                  
                  // Tạo câu hỏi
                  const question = await tx.ielts_reading_questions.create({
                    data: {
                      question_text: questionData.questionText || '',
                      question_type: groupData.questionType || 'multiple_choice',
                      options: questionData.options || [],
                      correct_answer: correctAnswer, // Lấy từ all_answers nếu có
                      explanation: questionData.explanation || null,
                      note: questionData.note || null,
                      order_index: orderIndex,
                      group_id: questionGroup.id,
                      created_at: new Date()
                    }
                  });
                  
                  // Lưu câu hỏi đã tạo để sử dụng sau
                  createdQuestions.push(question);
                }
              }
            }
          }
        }

        return { 
          success: true,
          questionCount: createdQuestions.length
        };
      });

      return res.status(201).json({
        message: 'IELTS Reading test created successfully',
        result
      });

    } catch (error) {
      console.error('Error creating IELTS Reading test:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 