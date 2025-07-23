import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API] /admin/ielts-reading/passages-with-questions - Method:', req.method);
  
  const firebase_uid = req.headers.firebase_uid as string;
  
  if (!firebase_uid) {
    console.log('[API] Unauthorized - missing firebase_uid');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user is admin
  const user = await prisma.users.findFirst({
    where: { firebase_uid }
  });

  if (!user || !user.is_admin) {
    console.log('[API] Forbidden - user not admin:', { userId: user?.id, isAdmin: user?.is_admin });
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    try {
      const { title, content, is_active, questions } = req.body;
      console.log('[API] Creating passage with questions:', {
        title,
        contentLength: content?.length || 0,
        isActive: is_active,
        questionsCount: questions?.length || 0
      });

      // Validate required fields
      if (!title || !content || !questions || !Array.isArray(questions)) {
        console.error('[API] Validation failed - missing required fields:', {
          hasTitle: !!title,
          hasContent: !!content,
          hasQuestions: !!questions,
          isQuestionsArray: Array.isArray(questions)
        });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate questions
      for (const question of questions) {
        if (!question.question_text || !question.correct_answer) {
          console.error('[API] Question validation failed:', {
            hasQuestionText: !!question.question_text,
            hasCorrectAnswer: !!question.correct_answer,
            question
          });
          return res.status(400).json({ error: 'All questions must have text and correct answer' });
        }
      }

      // Create passage with questions in a transaction
      console.log('[API] Starting transaction to create passage and questions...');
      const result = await prisma.$transaction(async (tx) => {
        // Create the passage
        console.log('[API] Creating passage:', title);
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
        console.log('[API] Passage created with ID:', passage.id);

        // Create questions for the passage
        console.log('[API] Creating', questions.length, 'questions for passage', passage.id);
        const createdQuestions = await Promise.all(
          questions.map((question: any, index: number) => {
            console.log('[API] Creating question', index + 1, ':', question.question_text?.substring(0, 50) + '...');
            return tx.ielts_reading_questions.create({
              data: {
                passage_id: passage.id,
                question_text: question.question_text,
                question_type: question.question_type || 'multiple_choice',
                options: question.options || [],
                correct_answer: question.correct_answer,
                explanation: question.explanation || '',
                order_index: question.order_index || 1
              }
            });
          })
        );
        console.log('[API] Successfully created', createdQuestions.length, 'questions');

        return {
          passage,
          questions: createdQuestions
        };
      });

      const response = {
        message: 'Passage and questions created successfully',
        passage: result.passage,
        questions: result.questions
      };
      
      console.log('[API] Transaction completed successfully:', {
        passageId: result.passage.id,
        questionsCreated: result.questions.length
      });
      
      return res.status(201).json(response);

    } catch (error) {
      console.error('[API] Error creating passage with questions:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  console.log('[API] Method not allowed:', req.method);
  return res.status(405).json({ error: 'Method not allowed' });
}