import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { week_start_date } = req.query;
      
      let where: any = {};
      if (week_start_date) {
        // Xử lý ngày từ frontend (YYYY-MM-DD) thành range cho database
        const startDate = new Date(week_start_date as string);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        
        where.week_start_date = {
          gte: startDate,
          lt: endDate
        };
      }

      const slots = await prisma.shiftSlot.findMany({
        where,
        include: {
          employee: true
        },
        orderBy: [
          { week_start_date: 'asc' },
          { day_of_week: 'asc' },
          { shift_period: 'asc' },
          { position: 'asc' }
        ]
      });

      return res.status(200).json(slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 