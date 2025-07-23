import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== Debug Questions API ===');
    
    // Test basic connection
    const passages = await prisma.ielts_reading_passages.findMany({
      select: { id: true, title: true }
    });
    console.log('Passages found:', passages);
    
    // Test question groups query
    const questionGroups = await prisma.ielts_reading_question_groups.findMany({
      where: { passage_id: 2 },
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
    
    console.log('Question groups found:', questionGroups.length);
    console.log('First group:', questionGroups[0]);
    
    return res.status(200).json({
      success: true,
      passages,
      questionGroupsCount: questionGroups.length,
      questionGroups: questionGroups.map(group => ({
        id: group.id,
        passage_id: group.passage_id,
        question_type: group.question_type,
        display_order: group.display_order,
        instructions: group.instructions,
        questionsCount: group.questions.length
      }))
    });
    
  } catch (error) {
    console.error('Debug API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}