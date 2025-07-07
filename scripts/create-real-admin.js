const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createRealAdminUser() {
  try {
    console.log('Tạo user admin thực tế...');

    // Thay thế bằng Firebase UID thực tế của bạn
    // Bạn có thể lấy Firebase UID từ Firebase Console hoặc từ user hiện tại
    const realFirebaseUID = 'your-actual-firebase-uid-here'; // Thay thế bằng UID thực

    const adminUser = await prisma.users.upsert({
      where: { firebase_uid: realFirebaseUID },
      update: {
        is_admin: true
      },
      create: {
        firebase_uid: realFirebaseUID,
        email: 'admin@vocabapp.com',
        display_name: 'Admin User',
        is_admin: true
      }
    });

    console.log('Đã tạo/cập nhật user admin:', adminUser);
    console.log('Firebase UID:', adminUser.firebase_uid);
    console.log('Email:', adminUser.email);
    console.log('Is Admin:', adminUser.is_admin);

    console.log('\nHướng dẫn:');
    console.log('1. Thay thế "your-actual-firebase-uid-here" bằng Firebase UID thực tế của bạn');
    console.log('2. Chạy lại script này');
    console.log('3. Đăng nhập với tài khoản Firebase của bạn');
    console.log('4. Truy cập /admin/ielts-reading');

  } catch (error) {
    console.error('Lỗi khi tạo user admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRealAdminUser(); 