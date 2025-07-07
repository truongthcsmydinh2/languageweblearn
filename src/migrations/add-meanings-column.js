const mysql = require('mysql2/promise');

async function main() {
  console.log('Bắt đầu migration để thêm cột meanings vào bảng terms...');
  let connection;

  try {
    // Kết nối đến database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'vocab_app'
    });

    console.log('Đã kết nối đến cơ sở dữ liệu');

    // Thêm cột meanings
    await connection.execute(`
      ALTER TABLE terms 
      ADD COLUMN IF NOT EXISTS meanings JSON DEFAULT '[]'
    `);

    console.log('Đã thêm cột meanings');

    // Cập nhật dữ liệu cho cột meanings từ cột meaning hiện có
    await connection.execute(`
      UPDATE terms 
      SET meanings = JSON_ARRAY(meaning) 
      WHERE meanings IS NULL OR JSON_LENGTH(meanings) = 0
    `);

    console.log('Đã cập nhật dữ liệu cho cột meanings');

    console.log('Migration hoàn tất thành công!');
  } catch (error) {
    console.error('Migration thất bại:', error);
    process.exit(1);
  } finally {
    if (connection) {
      // Đây là connection thông thường (không phải từ pool), nên sử dụng end() là đúng
      await connection.end();
    }
  }
}

main(); 