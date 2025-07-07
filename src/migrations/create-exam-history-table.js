const mysql = require('mysql2/promise');

async function main() {
  console.log('Bắt đầu migration để tạo bảng exam_history...');
  let connection;

  try {
    // Kết nối đến database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'myvps',
      password: 'abcd1234',
      database: 'vocab_app'
    });

    console.log('Đã kết nối đến cơ sở dữ liệu');

    // Tạo bảng exam_history
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exam_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firebase_uid VARCHAR(255) NOT NULL,
        exam_date DATETIME NOT NULL,
        total_questions INT NOT NULL,
        correct_answers INT NOT NULL,
        wrong_answers INT NOT NULL,
        accuracy DECIMAL(5,2) NOT NULL,
        grade VARCHAR(2) NOT NULL,
        settings JSON,
        details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_firebase_uid (firebase_uid),
        INDEX idx_exam_date (exam_date)
      )
    `);

    console.log('Đã tạo bảng exam_history thành công!');
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