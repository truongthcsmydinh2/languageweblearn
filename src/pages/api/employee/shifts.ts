import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { employee_id, week_start_date } = req.query;
      
      if (!employee_id) {
        return res.status(400).json({ error: 'Thiếu mã nhân viên' });
      }

      // Kiểm tra xem nhân viên có tồn tại không
      const employee = await prisma.employee.findUnique({
        where: { employee_id: employee_id as string }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
      }

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
      console.error('Error fetching employee shifts:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { employee_id, slot_id } = req.body;
      
      if (!employee_id || !slot_id) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }

      // Kiểm tra xem nhân viên có tồn tại không
      const employee = await prisma.employee.findUnique({
        where: { employee_id }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
      }

      // Kiểm tra xem slot có tồn tại không
      const slot = await prisma.shiftSlot.findUnique({
        where: { slot_id: parseInt(slot_id) }
      });

      if (!slot) {
        return res.status(404).json({ error: 'Không tìm thấy slot' });
      }

      // Kiểm tra xem slot có cố định không
      if (slot.is_fixed) {
        return res.status(400).json({ error: 'Không thể đăng ký slot cố định' });
      }

      // Kiểm tra xem slot đã được gán chưa
      if (slot.assigned_employee_id) {
        return res.status(400).json({ error: 'Slot này đã được đăng ký' });
      }

      // Kiểm tra xung đột thời gian
      const conflictingSlots = await prisma.shiftSlot.findMany({
        where: {
          assigned_employee_id: employee_id,
          week_start_date: slot.week_start_date,
          day_of_week: slot.day_of_week,
          shift_period: slot.shift_period
        }
      });

      if (conflictingSlots.length > 0) {
        return res.status(400).json({ error: 'Bạn đã đăng ký ca này rồi' });
      }

      // Đăng ký slot
      const updatedSlot = await prisma.shiftSlot.update({
        where: { slot_id: parseInt(slot_id) },
        data: { assigned_employee_id: employee_id },
        include: { employee: true }
      });

      return res.status(200).json(updatedSlot);
    } catch (error) {
      console.error('Error registering shift:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { employee_id, slot_id } = req.body;
      
      if (!employee_id || !slot_id) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }

      // Kiểm tra xem slot có thuộc về nhân viên này không
      const slot = await prisma.shiftSlot.findFirst({
        where: {
          slot_id: parseInt(slot_id),
          assigned_employee_id: employee_id
        }
      });

      if (!slot) {
        return res.status(404).json({ error: 'Không tìm thấy slot đã đăng ký' });
      }

      // Kiểm tra xem slot có cố định không
      if (slot.is_fixed) {
        return res.status(400).json({ error: 'Không thể hủy slot cố định' });
      }

      // Hủy đăng ký slot
      await prisma.shiftSlot.update({
        where: { slot_id: parseInt(slot_id) },
        data: { assigned_employee_id: null }
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error canceling shift:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 