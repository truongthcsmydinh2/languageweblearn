import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const passages = await prisma.ielts_reading_passages.findMany({
      where: {
        is_active: true
      },
      include: {
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const formattedPassages = passages.map(passage => ({
      id: passage.id,
      title: passage.title,
      content: passage.content,
      level: passage.level,
      category: passage.category,
      time_limit: passage.time_limit,
      question_count: passage._count.questions
    }));

    return res.status(200).json({
      passages: formattedPassages
    });

  } catch (error) {
    console.error('Error fetching passages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 