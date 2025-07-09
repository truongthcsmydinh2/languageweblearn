import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 1. Tạo bảng tạm thời
    await db.execute(`
      CREATE TABLE temp_terms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vocab VARCHAR(255) NOT NULL,
        meaning TEXT NOT NULL,
        level_en INT DEFAULT 0,
        level_vi INT DEFAULT 0,
        time_added BIGINT,
        review_time_en DATE,
        review_time_vi DATE,
        firebase_uid VARCHAR(128),
        example TEXT,
        notes TEXT,
        set_id INT,
        INDEX (vocab),
        INDEX (firebase_uid)
      )
    `);
    
    // 2. Sao chép dữ liệu từ bảng cũ đến bảng tạm (loại bỏ bản ghi trống)
    await db.execute(`
      INSERT INTO temp_terms (vocab, meaning, level_en, level_vi, time_added, review_time_en, review_time_vi, firebase_uid)
      SELECT vocab, meaning, level, level, time_added, review_time, review_time, firebase_uid FROM terms
      WHERE vocab != ''
    `);
    
    // 3. Đổi tên bảng
    await db.execute(`
      DROP TABLE terms;
      RENAME TABLE temp_terms TO terms;
    `);
    
    return res.status(200).json({
      success: true,
      message: "Table structure has been fixed successfully with separate fields for English and Vietnamese levels and review times!"
    });
  } catch (error) {
    console.error('Error fixing table structure:', error);
    return res.status(500).json({
      error: 'Failed to fix table structure',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 