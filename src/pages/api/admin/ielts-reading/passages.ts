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

  if (req.method === 'GET') {
    try {
      const passages = await prisma.ielts_reading_passages.findMany({
        include: {
          _count: {
            select: {
              questions: true
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { created_at: 'desc' }
        ]
      });

      // Group passages by category (test)
      const groupedPassages = passages.reduce((groups: any, passage) => {
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
        question_count: passage._count.questions
        });
        return groups;
      }, {});

      return res.status(200).json({
        passages: passages.map(passage => ({
          id: passage.id,
          title: passage.title,
          content: passage.content,
          questions_content: passage.questions_content,
          level: passage.level,
          category: passage.category,
          time_limit: passage.time_limit,
          is_active: passage.is_active,
          question_count: passage._count.questions
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