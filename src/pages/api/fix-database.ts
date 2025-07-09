import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Kiểm tra cấu trúc bảng hiện tại
    const [tableColumns] = await db.query('SHOW COLUMNS FROM terms');
    console.log('Current table structure:', tableColumns);

    // Lấy thông tin chi tiết về PRIMARY KEY
    const [createTable] = await db.query('SHOW CREATE TABLE terms');
    console.log('Table definition:', createTable);

    // Nếu bảng có cấu trúc cũ, thực hiện cập nhật
    const hasPrimaryKey = Array.isArray(tableColumns) && tableColumns.some(
      col => col.Key === 'PRI' && col.Field === 'vocab'
    );

    if (hasPrimaryKey) {
      // Xóa bản ghi với vocab rỗng
      await db.execute("DELETE FROM terms WHERE vocab = '' OR vocab IS NULL");
      console.log('Deleted empty vocab entries');

      // Cố gắng thay đổi cấu trúc của bảng
      try {
        // Tạo bảng mới
        await db.execute(`
          CREATE TABLE terms_new (
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
        console.log('Created new table structure');

        // Copy dữ liệu
        await db.execute(`
          INSERT INTO terms_new (vocab, meaning, level_en, level_vi, time_added, review_time_en, review_time_vi, firebase_uid)
          SELECT vocab, meaning, level, level, time_added, review_time, review_time, firebase_uid FROM terms
          WHERE vocab IS NOT NULL AND vocab != ''
        `);
        console.log('Copied existing data to new table');

        // Đổi tên bảng
        await db.execute('RENAME TABLE terms TO terms_old, terms_new TO terms');
        console.log('Renamed tables');

        return res.status(200).json({
          success: true,
          message: "Database structure fixed successfully. Updated to use separate fields for English and Vietnamese levels and review times."
        });
      } catch (alterError) {
        console.error('Error altering table:', alterError);
        return res.status(500).json({
          error: 'Failed to alter table structure',
          details: alterError instanceof Error ? alterError.message : String(alterError)
        });
      }
    } else {
      return res.status(200).json({
        success: true,
        message: "Database structure already looks good. No changes needed."
      });
    }
  } catch (error) {
    console.error('Error fixing database:', error);
    return res.status(500).json({
      error: 'Failed to fix database',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 