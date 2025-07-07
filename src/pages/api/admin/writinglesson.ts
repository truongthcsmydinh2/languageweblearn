import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { level, type } = req.query;
    console.log('🔍 API Filter params:', { level, type });
    
    const where: any = {};
    if (level) where.level = String(level).toUpperCase();
    if (type) where.type = String(type).toUpperCase();
    
    console.log('🔍 Prisma where clause:', where);
    
    const lessons = await prisma.writingLesson.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: { id: true, title: true, content: true, level: true, type: true, created_at: true, updated_at: true }
    });
    
    console.log('📊 Found lessons:', lessons.length, 'lessons');
    console.log('📋 Lesson types:', lessons.map(l => l.type));
    
    return res.status(200).json(lessons);
  }

  if (req.method === 'POST') {
    // Thêm mới bài viết
    const { title, content, level, type, sentences: inputSentences } = req.body;
    if (!title || !content || !level || !type) return res.status(400).json({ error: 'Thiếu thông tin' });
    let sentences;
    if (Array.isArray(inputSentences) && inputSentences.length > 0) {
      sentences = inputSentences;
    } else {
      sentences = splitSentences(content).map((vietnamese, idx) => ({ vietnamese, sentence_order: idx + 1 }));
    }
    const lesson = await prisma.writingLesson.create({
      data: {
        title,
        content,
        level,
        type,
        sentences: {
          create: sentences.map((s, idx) => ({
            vietnamese: s.vietnamese,
            sentence_order: s.sentence_order || idx + 1,
            answer_key: s.answer_key || ''
          }))
        }
      },
      include: { sentences: true }
    });
    return res.status(201).json(lesson);
  }

  if (req.method === 'PUT') {
    // Sửa bài viết
    const { id, title, content, level, type, sentences: inputSentences } = req.body;
    if (!id || !title || !content || !level || !type) return res.status(400).json({ error: 'Thiếu thông tin' });
    let sentences;
    if (Array.isArray(inputSentences) && inputSentences.length > 0) {
      sentences = inputSentences;
    } else {
      sentences = splitSentences(content).map((vietnamese, idx) => ({ vietnamese, sentence_order: idx + 1 }));
    }
    await prisma.writingSentence.deleteMany({ where: { lesson_id: id } });
    const lesson = await prisma.writingLesson.update({
      where: { id },
      data: {
        title,
        content,
        level,
        type,
        sentences: {
          create: sentences.map((s, idx) => ({
            vietnamese: s.vietnamese,
            sentence_order: s.sentence_order || idx + 1,
            answer_key: s.answer_key || ''
          }))
        }
      },
      include: { sentences: true }
    });
    return res.status(200).json(lesson);
  }

  if (req.method === 'DELETE') {
    // Xóa bài viết
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Thiếu id' });
    await prisma.writingLesson.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 