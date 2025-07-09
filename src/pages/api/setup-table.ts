import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Kiểm tra cấu trúc hiện tại của bảng terms
    const [tableInfo] = await db.query(`
      SHOW CREATE TABLE terms
    `);
    
    console.log('Current table structure:', tableInfo);
    
    // Tạo bảng mới với id tự tăng làm khóa chính
    await db.execute(`
      CREATE TABLE IF NOT EXISTS terms_new (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vocab VARCHAR(255) NOT NULL,
        meaning TEXT NOT NULL,
        level_en INT DEFAULT 0,
        level_vi INT DEFAULT 0,
        time_added BIGINT,
        review_time_en DATE,
        review_time_vi DATE,
        example TEXT,
        notes TEXT,
        set_id INT,
        firebase_uid VARCHAR(128),
        INDEX idx_vocab (vocab),
        INDEX idx_firebase_uid (firebase_uid)
      )
    `);
    
    // Chép dữ liệu từ bảng cũ sang bảng mới
    await db.execute(`
      INSERT IGNORE INTO terms_new (vocab, meaning, level_en, level_vi, time_added, review_time_en, review_time_vi, firebase_uid)
      SELECT vocab, meaning, level, level, time_added, review_time, review_time, firebase_uid FROM terms
    `);
    
    // Đổi tên bảng
    await db.execute('RENAME TABLE terms TO terms_old, terms_new TO terms');
    
    return res.status(200).json({ 
      success: true, 
      message: "Table structure updated successfully. The 'terms' table now uses separate fields for English and Vietnamese levels and review times." 
    });
  } catch (error) {
    console.error('Error setting up table:', error);
    return res.status(500).json({ 
      error: 'Failed to set up table', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
} 