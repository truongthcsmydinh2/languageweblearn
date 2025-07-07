const mysql = require('mysql2/promise');

async function main() {
  console.log('Bắt đầu migration để thêm cột part_of_speech vào bảng terms...');
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

    // Thêm cột part_of_speech
    await connection.execute(`
      ALTER TABLE terms 
      ADD COLUMN IF NOT EXISTS part_of_speech VARCHAR(50) DEFAULT NULL
    `);

    console.log('Đã thêm cột part_of_speech');
    console.log('Migration hoàn tất thành công!');
  } catch (error) {
    console.error('Migration thất bại:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main(); 