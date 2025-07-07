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
      const { title, description, is_active, passages, all_answers } = req.body;

      // Validate required fields
      if (!title || !passages || !Array.isArray(passages) || passages.length !== 3) {
        return res.status(400).json({ error: 'Missing required fields or must have exactly 3 passages' });
      }

      // Validate each passage
      for (const passage of passages) {
        if (!passage.title || !passage.content || !Array.isArray(passage.questions)) {
          return res.status(400).json({ error: 'Each passage must have title, content and questions array' });
        }

        // Validate questions
        for (const question of passage.questions) {
          if (!question.question_text) {
            return res.status(400).json({ error: 'All questions must have text' });
          }
        }
      }

      // Create complete IELTS test with all passages and questions in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const createdPassages = [];

        // Create all passages and their questions
        for (const passage of passages) {
          // Create the passage
          const createdPassage = await tx.ielts_reading_passages.create({
            data: {
              title: passage.title,
              content: passage.content,
              questions_content: passage.questions_content || '',
              level: 'intermediate', // Default level
              category: title, // Use test title as category to group passages
              time_limit: 20, // Default time limit
              is_active
            }
          });

          // Create questions for the passage
          const createdQuestions = await Promise.all(
            passage.questions.map((question: any) =>
              tx.ielts_reading_questions.create({
                data: {
                  passage_id: createdPassage.id,
                  question_text: question.question_text,
                  question_type: question.question_type || 'multiple_choice',
                  options: question.options || [],
                  correct_answer: question.correct_answer || '',
                  explanation: question.explanation || '',
                  order_index: question.order_index || 1
                }
              })
            )
          );

          createdPassages.push({
            passage: createdPassage,
            questions: createdQuestions,
            questions_content: passage.questions_content || ''
          });
        }

        // Lưu đáp án Task 3 nếu có
        let task3AnswersData = null;
        if (all_answers && Array.isArray(all_answers) && all_answers.length > 0) {
          // Tạo một passage đặc biệt để lưu đáp án Task 3
          const task3AnswersPassage = await tx.ielts_reading_passages.create({
            data: {
              title: `${title} - Task 3 Answers`,
              content: 'Task 3 Answer Key',
              questions_content: JSON.stringify(all_answers),
              level: 'intermediate',
              category: title,
              time_limit: 20,
              is_active: false // Không hiển thị trong danh sách bài đọc
            }
          });

          task3AnswersData = {
            passage: task3AnswersPassage,
            answers: all_answers
          };
        }

        return {
          test_title: title,
          test_description: description,
          passages: createdPassages,
          task3_answers: task3AnswersData
        };
      });

      return res.status(201).json({
        message: 'IELTS Reading test created successfully',
        test: result
      });

    } catch (error) {
      console.error('Error creating IELTS test:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 