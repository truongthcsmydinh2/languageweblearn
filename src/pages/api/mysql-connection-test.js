import { db } from '@/lib/mysql';

export default async function handler(req, res) {
  try {
    // Kiểm tra kết nối qua pool
    const [rows] = await db.execute('SELECT 1 + 1 AS result');
    return res.status(200).json({ 
      success: true, 
      message: 'Kết nối MySQL thành công!',
      data: rows[0]
    });
  } catch (error) {
    console.error('Lỗi kết nối MySQL:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi kết nối MySQL', 
      error: error.message
    });
  }
} 