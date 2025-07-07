import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Kiểm tra kết nối
    await prisma.$connect();
    
    // Thử truy vấn đơn giản
    const count = await prisma.terms.count();
    
    return res.status(200).json({ 
      message: 'Kết nối thành công!', 
      count,
      databaseUrl: process.env.DATABASE_URL?.replace(/\/\/.*?:.*?@/, '//<username>:<password>@')
    });
  } catch (error) {
    return res.status(500).json({ 
      message: 'Lỗi kết nối database', 
      error: String(error),
      databaseUrl: process.env.DATABASE_URL?.replace(/\/\/.*?:.*?@/, '//<username>:<password>@')
    });
  } finally {
    await prisma.$disconnect();
  }
} 