import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { week_start_date, day_of_week, shift_period, role } = req.query;
      
      const where: any = {};
      if (week_start_date) where.week_start_date = new Date(week_start_date as string);
      if (day_of_week) where.day_of_week = parseInt(day_of_week as string);
      if (shift_period) where.shift_period = shift_period;
      if (role) where.role = role;

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
      console.error('Error fetching shift slots:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  // Vô hiệu hóa chức năng tạo slot đơn lẻ - chỉ cho phép tạo tuần mới qua generate-week-slots
  if (req.method === 'POST') {
    return res.status(403).json({ 
      error: 'Chức năng tạo slot đơn lẻ đã bị vô hiệu hóa. Vui lòng sử dụng API tạo tuần mới để tạo slot.' 
    });
  }

  if (req.method === 'PUT') {
    try {
      const { slot_id, assigned_employee_id, is_fixed } = req.body;
      
      if (!slot_id) {
        return res.status(400).json({ error: 'Thiếu ID slot' });
      }

      const slot = await prisma.shiftSlot.update({
        where: { slot_id: parseInt(slot_id) },
        data: {
          assigned_employee_id: assigned_employee_id || null,
          is_fixed: is_fixed !== undefined ? is_fixed : false
        },
        include: {
          employee: true
        }
      });

      return res.status(200).json(slot);
    } catch (error) {
      console.error('Error updating shift slot:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { slot_id } = req.body;
      
      if (!slot_id) {
        return res.status(400).json({ error: 'Thiếu ID slot' });
      }

      await prisma.shiftSlot.delete({
        where: { slot_id: parseInt(slot_id) }
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting shift slot:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 