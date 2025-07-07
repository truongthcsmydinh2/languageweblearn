import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const employees = await prisma.employee.findMany({
        orderBy: { created_at: 'desc' }
      });
      return res.status(200).json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { employee_id, full_name, role } = req.body;
      
      if (!employee_id || !full_name || !role) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }

      const existingEmployee = await prisma.employee.findUnique({
        where: { employee_id }
      });

      if (existingEmployee) {
        return res.status(400).json({ error: 'Mã nhân viên đã tồn tại' });
      }

      const employee = await prisma.employee.create({
        data: {
          employee_id,
          full_name,
          role
        }
      });

      return res.status(201).json(employee);
    } catch (error) {
      console.error('Error creating employee:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { employee_id, full_name, role } = req.body;
      
      if (!employee_id || !full_name || !role) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }

      const employee = await prisma.employee.update({
        where: { employee_id },
        data: {
          full_name,
          role
        }
      });

      return res.status(200).json(employee);
    } catch (error) {
      console.error('Error updating employee:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { employee_id } = req.body;
      
      if (!employee_id) {
        return res.status(400).json({ error: 'Thiếu mã nhân viên' });
      }

      // Kiểm tra xem nhân viên có đang được gán vào slot nào không
      const assignedSlots = await prisma.shiftSlot.findMany({
        where: { assigned_employee_id: employee_id }
      });

      // Nếu nhân viên đang được gán vào slot, xóa luôn slot đó
      if (assignedSlots.length > 0) {
        console.log(`Xóa ${assignedSlots.length} slot đã gán cho nhân viên ${employee_id}`);
        
        // Xóa tất cả slot đã gán cho nhân viên này
        await prisma.shiftSlot.updateMany({
          where: { assigned_employee_id: employee_id },
          data: { 
            assigned_employee_id: null,
            is_fixed: false // Chuyển về trạng thái không cố định
          }
        });
      }

      // Xóa nhân viên
      await prisma.employee.delete({
        where: { employee_id }
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting employee:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 