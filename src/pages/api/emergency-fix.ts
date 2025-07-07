import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Hiển thị tất cả các bản ghi trong bảng
    const [allRecords] = await db.execute('SELECT * FROM terms');
    console.log('All records in terms table:', allRecords);

    // Xóa bất kỳ bản ghi nào có vocab là chuỗi rỗng
    const [deleteResult] = await db.execute("DELETE FROM terms WHERE vocab = ''");
    console.log('Delete result:', deleteResult);

    // Hiển thị PRIMARY KEY của bảng
    const [showKeys] = await db.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'terms' AND CONSTRAINT_NAME = 'PRIMARY'"
    );
    console.log('Primary key info:', showKeys);

    // Lấy tất cả các cột trong bảng
    const [columns] = await db.execute('SHOW COLUMNS FROM terms');
    console.log('Columns in terms table:', columns);

    return res.status(200).json({
      success: true,
      message: "Emergency fix applied. Check server logs for details.",
      records: allRecords,
      columns: columns,
      primaryKey: showKeys
    });
  } catch (error) {
    console.error('Error during emergency fix:', error);
    return res.status(500).json({
      error: 'Emergency fix failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 