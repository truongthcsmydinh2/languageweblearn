// Migration script để cập nhật ràng buộc duy nhất trên bảng terms
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('Bắt đầu migration để cập nhật ràng buộc duy nhất trên bảng terms...');
  
  // Đọc thông tin kết nối từ file lib/mysql.ts
  const mysqlTsPath = path.join(__dirname, '..', 'lib', 'mysql.ts');
  console.log(`Đọc thông tin kết nối từ file: ${mysqlTsPath}`);
  
  let mysqlConfig = {};
  
  try {
    const mysqlTsContent = fs.readFileSync(mysqlTsPath, 'utf8');
    
    // Trích xuất thông tin kết nối từ nội dung file
    const hostMatch = mysqlTsContent.match(/host:\s*['"]([^'"]+)['"]/);
    const portMatch = mysqlTsContent.match(/port:\s*([0-9]+)/);
    const userMatch = mysqlTsContent.match(/user:\s*['"]([^'"]+)['"]/);
    const passwordMatch = mysqlTsContent.match(/password:\s*['"]([^'"]+)['"]/);
    const databaseMatch = mysqlTsContent.match(/database:\s*['"]([^'"]+)['"]/);
    
    mysqlConfig = {
      host: hostMatch ? hostMatch[1] : 'localhost',
      port: portMatch ? parseInt(portMatch[1]) : 3306,
      user: userMatch ? userMatch[1] : 'root',
      password: passwordMatch ? passwordMatch[1] : '',
      database: databaseMatch ? databaseMatch[1] : 'vocab_app',
    };
    
    console.log('Đã trích xuất thông tin kết nối:', {
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      database: mysqlConfig.database,
      // Không hiển thị mật khẩu vì lý do bảo mật
    });
  } catch (error) {
    console.error('Lỗi khi đọc file mysql.ts:', error);
    console.log('Sử dụng thông tin kết nối mặc định...');
    
    // Sử dụng thông tin kết nối mặc định
    mysqlConfig = {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'vocab_app',
    };
  }
  
  // Kết nối đến cơ sở dữ liệu
  console.log('Kết nối đến cơ sở dữ liệu...');
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    // Bắt đầu transaction
    await connection.beginTransaction();
    
    console.log('Kiểm tra xem chỉ mục idx_vocab có tồn tại không...');
    
    // Kiểm tra xem chỉ mục idx_vocab có tồn tại không
    const [indexes] = await connection.query(`
      SHOW INDEX FROM terms WHERE Key_name = 'idx_vocab'
    `);
    
    if (indexes.length > 0) {
      console.log('Xóa ràng buộc duy nhất hiện tại trên cột vocab...');
      
      // Xóa ràng buộc duy nhất hiện tại
      await connection.query(`
        ALTER TABLE terms DROP INDEX idx_vocab
      `);
      
      console.log('Đã xóa ràng buộc duy nhất trên cột vocab.');
    } else {
      console.log('Không tìm thấy chỉ mục idx_vocab.');
    }
    
    console.log('Kiểm tra xem chỉ mục idx_vocab_meaning_user đã tồn tại chưa...');
    
    // Kiểm tra xem chỉ mục idx_vocab_meaning_user đã tồn tại chưa
    const [existingIndexes] = await connection.query(`
      SHOW INDEX FROM terms WHERE Key_name = 'idx_vocab_meaning_user'
    `);
    
    if (existingIndexes.length === 0) {
      console.log('Thêm ràng buộc duy nhất mới trên kết hợp của vocab, meaning và firebase_uid...');
      
      // Thêm ràng buộc duy nhất mới
      await connection.query(`
        ALTER TABLE terms ADD UNIQUE INDEX idx_vocab_meaning_user (vocab, meaning, firebase_uid)
      `);
      
      console.log('Đã thêm ràng buộc duy nhất mới.');
    } else {
      console.log('Chỉ mục idx_vocab_meaning_user đã tồn tại.');
    }
    
    // Commit transaction
    await connection.commit();
    
    console.log('Migration hoàn tất thành công!');
  } catch (error) {
    // Rollback nếu có lỗi
    await connection.rollback();
    console.error('Lỗi khi thực hiện migration:', error);
    throw error;
  } finally {
    // Đóng kết nối
    // Đây là connection thông thường (không phải từ pool), nên sử dụng end() là đúng
    await connection.end();
  }
}

// Chạy script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration thất bại:', error);
    process.exit(1);
  }); 