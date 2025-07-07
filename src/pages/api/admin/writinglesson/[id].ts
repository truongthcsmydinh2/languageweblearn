import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID bài viết' });
  }

  try {
    const lesson = await prisma.writingLesson.findUnique({
      where: { id: Number(id) },
      include: {
        sentences: {
          orderBy: { sentence_order: 'asc' }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    // Chuyển đổi format để tương thích với frontend
    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      sentences: lesson.sentences.map(s => ({
        id: s.id,
        vietnamese_text: s.vietnamese,
        sentence_order: s.sentence_order,
        answer_key: s.answer_key || ''
      }))
    };

    return res.status(200).json(formattedLesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
} 