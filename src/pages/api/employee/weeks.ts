import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Lấy tất cả week_start_date đã có slot, sort tăng dần
    const weeks = await prisma.shiftSlot.findMany({
      select: { week_start_date: true },
      distinct: ['week_start_date'],
      orderBy: { week_start_date: 'asc' }
    });

    // Tính week_end_date cho từng tuần
    const result = weeks.map(w => {
      const start = new Date(w.week_start_date);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        week_start_date: start.toISOString().split('T')[0],
        week_end_date: end.toISOString().split('T')[0]
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching weeks:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
} 