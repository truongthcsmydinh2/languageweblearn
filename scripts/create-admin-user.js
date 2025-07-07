const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Tạo user admin...');

    // Thay thế firebase_uid bằng UID thực tế của bạn
    const adminUser = await prisma.users.upsert({
      where: { firebase_uid: 'admin-test-uid' },
      update: {
        is_admin: true
      },
      create: {
        firebase_uid: 'admin-test-uid',
        email: 'admin@example.com',
        display_name: 'Admin User',
        is_admin: true
      }
    });

    console.log('Đã tạo/cập nhật user admin:', adminUser);
    console.log('Firebase UID:', adminUser.firebase_uid);
    console.log('Email:', adminUser.email);
    console.log('Is Admin:', adminUser.is_admin);

  } catch (error) {
    console.error('Lỗi khi tạo user admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 