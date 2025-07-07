import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lessonId, limit = 10, offset = 0 } = req.query;

  try {
    const whereClause = lessonId ? { lesson_id: Number(lessonId) } : {};

    const submissions = await prisma.writing_submissions.findMany({
      where: whereClause,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            level: true,
            type: true
          }
        },
        sentence: {
          select: {
            id: true,
            vietnamese: true,
            sentence_order: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    });

    // Đếm tổng số submissions
    const totalCount = await prisma.writing_submissions.count({
      where: whereClause
    });

    // Tính thống kê
    const stats = await prisma.writing_submissions.aggregate({
      where: whereClause,
      _avg: {
        score: true
      },
      _count: {
        id: true
      },
      _min: {
        score: true
      },
      _max: {
        score: true
      }
    });

    return res.status(200).json({
      submissions: submissions.map(sub => ({
        id: sub.id,
        lessonId: sub.lesson_id,
        sentenceId: sub.sentence_id,
        userAnswer: sub.user_answer,
        originalSentence: sub.original_sentence,
        score: sub.score,
        feedback: sub.feedback,
        errors: JSON.parse(sub.errors),
        suggestions: JSON.parse(sub.suggestions),
        correctedVersion: sub.corrected_version,
        advice: sub.advice,
        createdAt: sub.created_at,
        lesson: {
          id: sub.lesson.id,
          title: sub.lesson.title,
          level: sub.lesson.level,
          type: sub.lesson.type
        },
        sentence: {
          id: sub.sentence.id,
          vietnamese: sub.sentence.vietnamese,
          sentenceOrder: sub.sentence.sentence_order
        }
      })),
      pagination: {
        total: totalCount,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < totalCount
      },
      stats: {
        averageScore: stats._avg.score || 0,
        totalSubmissions: stats._count.id,
        minScore: stats._min.score || 0,
        maxScore: stats._max.score || 0
      }
    });

  } catch (error) {
    console.error('Error fetching submission history:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
} 