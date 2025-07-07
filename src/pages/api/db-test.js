// src/pages/api/test-mysql.js
import { connectToDatabase } from '@/lib/mysql';

export default async function handler(req, res) {
  try {
    const conn = await connectToDatabase();
    const [rows] = await conn.execute('SELECT 1 + 1 AS result');
    await conn.end();
    
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