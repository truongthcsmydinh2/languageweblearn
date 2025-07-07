import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Thử lấy URL kết nối từ các biến riêng lẻ nếu DATABASE_URL không tồn tại
function getDatabaseUrl() {
  // Ưu tiên sử dụng DATABASE_URL nếu đã được cấu hình
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Tạo URL từ các biến riêng lẻ
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const database = process.env.DB_NAME;

  if (user && password && host && port && database) {
    // Mã hóa mật khẩu để xử lý các ký tự đặc biệt
    const encodedPassword = encodeURIComponent(password);
    const url = `mysql://${user}:${encodedPassword}@${host}:${port}/${database}`;
    return url;
  }

  return process.env.DATABASE_URL; // Trả về undefined nếu không có đủ thông tin
}

// Khởi tạo PrismaClient với URL đã xử lý
const databaseUrl = getDatabaseUrl();

export const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 