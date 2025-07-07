import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const firebase_uid = req.headers.firebase_uid as string;
    
    if (!firebase_uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Lấy user từ firebase_uid
    const user = await prisma.users.findFirst({
      where: { firebase_uid: firebase_uid }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Lấy tất cả từ vựng của user, ưu tiên những từ có level thấp hoặc chưa được review
    const terms = await prisma.terms.findMany({
      where: {
        firebase_uid: firebase_uid
      },
      orderBy: [
        { last_review_en: 'asc' },
        { last_review_vi: 'asc' },
        { created_at: 'desc' }
      ],
      take: 50 // Giới hạn 50 từ để tạo câu hỏi
    });

    // Xử lý meanings để đảm bảo format đúng
    const processedTerms = terms.map((term: any) => ({
      ...term,
      meanings: term.meanings ? (typeof term.meanings === 'string' ? JSON.parse(term.meanings) : term.meanings) : [],
      last_review_en: term.last_review_en ? Number(term.last_review_en) : 0,
      last_review_vi: term.last_review_vi ? Number(term.last_review_vi) : 0,
      created_at: term.created_at.toISOString(),
      updated_at: term.updated_at.toISOString()
    }));

    return res.status(200).json({
      terms: processedTerms,
      total: processedTerms.length
    });

  } catch (error) {
    console.error('Error in exam API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}