import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Bỏ qua kiểm tra firebase_uid và quyền admin
  
  if (req.method === 'GET') {
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
      console.error('Error fetching passages:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, content, level, category, time_limit, is_active } = req.body;

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

      return res.status(201).json({
        passage
      });

    } catch (error) {
      console.error('Error creating passage:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 