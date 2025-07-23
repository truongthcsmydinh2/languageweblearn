import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API] /admin/ielts-reading/passages - Method:', req.method);
  // Bỏ qua kiểm tra firebase_uid và quyền admin
  
  if (req.method === 'GET') {
    console.log('[API] Fetching all passages...');
    try {
      const passages = await prisma.ielts_reading_passages.findMany({
        include: {
          question_groups: {
            include: {
              _count: {
                select: {
                  questions: true
                }
              }
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { created_at: 'desc' }
        ]
      });

      // Tính tổng số câu hỏi cho mỗi passage
      const passagesWithCount = passages.map(passage => {
        const questionCount = passage.question_groups.reduce((sum, group) => 
          sum + (group._count?.questions || 0), 0);
        
        return {
          ...passage,
          question_count: questionCount
        };
      });

      // Group passages by category (test)
      const groupedPassages = passagesWithCount.reduce((groups: any, passage) => {
        const category = passage.category || 'Uncategorized';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push({
          id: passage.id,
          title: passage.title,
          content: passage.content,
          level: passage.level,
          category: passage.category,
          time_limit: passage.time_limit,
          is_active: passage.is_active,
          question_count: passage.question_count
        });
        return groups;
      }, {});

      console.log('[API] Successfully fetched', passagesWithCount.length, 'passages');
      return res.status(200).json({
        passages: passagesWithCount.map(passage => ({
          id: passage.id,
          title: passage.title,
          content: passage.content,
          level: passage.level,
          category: passage.category,
          time_limit: passage.time_limit,
          is_active: passage.is_active,
          question_count: passage.question_count
        })),
        groupedPassages
      });

    } catch (error) {
      console.error('[API] Error fetching passages:', error);
      return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  if (req.method === 'POST') {
    console.log('[API] Creating new passage with data:', req.body);
    try {
      const { title, content, level, category, time_limit, is_active } = req.body;

      // Validate required fields
      if (!title || !content) {
        console.error('[API] Missing required fields:', { title: !!title, content: !!content });
        return res.status(400).json({ error: 'Title and content are required' });
      }

      console.log('[API] Creating passage in database...');
      const passage = await prisma.ielts_reading_passages.create({
        data: {
          title,
          content,
          level,
          category,
          time_limit,
          is_active
        }
      });

      console.log('[API] Passage created successfully with ID:', passage.id);
      return res.status(201).json({
        passage
      });

    } catch (error) {
      console.error('[API] Error creating passage:', error);
      return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}