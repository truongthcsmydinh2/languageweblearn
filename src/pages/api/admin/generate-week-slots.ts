import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { start_date, end_date, fixed_assignments } = req.body;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Thiếu ngày bắt đầu hoặc kết thúc' });
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      // Kiểm tra khoảng cách giữa start_date và end_date
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff !== 6) {
        return res.status(400).json({ error: 'Khoảng cách giữa ngày bắt đầu và kết thúc phải là 7 ngày (từ Thứ 2 đến Chủ Nhật)' });
      }

      // Kiểm tra xem đã có slot cho tuần này chưa
      const existingSlots = await prisma.shiftSlot.findMany({
        where: {
          week_start_date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      if (existingSlots.length > 0) {
        return res.status(400).json({ error: 'Đã có slot cho tuần này. Vui lòng chọn tuần khác.' });
      }

      // Tạo slot cho tuần mới
      const slots = [];
      const periods: ('SANG' | 'CHIEU' | 'TOI')[] = ['SANG', 'CHIEU', 'TOI'];
      
      // Tạo slot cho mỗi ngày trong tuần (Thứ 2 - Chủ Nhật)
      for (let day = 1; day <= 7; day++) {
        for (let period of periods) {
          // Vị trí 1: Pha chế
          slots.push({
            week_start_date: startDate,
            day_of_week: day,
            shift_period: period,
            role: 'PHA_CHE' as any,
            position: 1,
            assigned_employee_id: fixed_assignments?.find((fa: any) =>
              fa.day_of_week === day &&
              fa.shift_period === period &&
              fa.role === 'PHA_CHE' &&
              fa.position === 1
            )?.employee_id || null,
            is_fixed: !!fixed_assignments?.find((fa: any) =>
              fa.day_of_week === day &&
              fa.shift_period === period &&
              fa.role === 'PHA_CHE' &&
              fa.position === 1
            )?.employee_id
          });
          // Vị trí 2: Order 1
          slots.push({
            week_start_date: startDate,
            day_of_week: day,
            shift_period: period,
            role: 'ORDER' as any,
            position: 2,
            assigned_employee_id: fixed_assignments?.find((fa: any) =>
              fa.day_of_week === day &&
              fa.shift_period === period &&
              fa.role === 'ORDER' &&
              fa.position === 2
            )?.employee_id || null,
            is_fixed: !!fixed_assignments?.find((fa: any) =>
              fa.day_of_week === day &&
              fa.shift_period === period &&
              fa.role === 'ORDER' &&
              fa.position === 2
            )?.employee_id
          });
          // Vị trí 3: Order 2
          slots.push({
            week_start_date: startDate,
            day_of_week: day,
            shift_period: period,
            role: 'ORDER' as any,
            position: 3,
            assigned_employee_id: fixed_assignments?.find((fa: any) =>
              fa.day_of_week === day &&
              fa.shift_period === period &&
              fa.role === 'ORDER' &&
              fa.position === 3
            )?.employee_id || null,
            is_fixed: !!fixed_assignments?.find((fa: any) =>
              fa.day_of_week === day &&
              fa.shift_period === period &&
              fa.role === 'ORDER' &&
              fa.position === 3
            )?.employee_id
          });
        }
      }

      // Tạo tất cả slot
      const createdSlots = await prisma.shiftSlot.createMany({
        data: slots
      });

      console.log(`Đã tạo ${createdSlots.count} slot cho tuần từ ${start_date} đến ${end_date}`);
      
      if (fixed_assignments?.length > 0) {
        console.log(`Đã gán ${fixed_assignments.length} nhân viên cố định`);
      }

      return res.status(201).json({ 
        message: 'Tạo slot cho tuần mới thành công',
        slots_created: createdSlots.count,
        fixed_assignments: fixed_assignments?.length || 0
      });

    } catch (error) {
      console.error('Error generating week slots:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 