import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log("Kiểm tra các bảng trong database");
    
    // Kết nối trực tiếp để truy vấn danh sách bảng
    const tableQuery = await prisma.$queryRaw`SHOW TABLES`;
    console.log("Danh sách bảng:", tableQuery);
    
    return res.status(200).json({ 
      message: 'Truy vấn thành công', 
      tables: tableQuery
    });
  } catch (error) {
    console.error("Lỗi truy vấn:", error);
    return res.status(500).json({ 
      message: 'Lỗi khi kiểm tra bảng', 
      error: String(error)
    });
  } finally {
    await prisma.$disconnect();
  }
} 