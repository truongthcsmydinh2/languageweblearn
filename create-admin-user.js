const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.users.findFirst({
      where: { firebase_uid: 'test-admin-uid' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return existingAdmin;
    }

    // Create new admin user
    const adminUser = await prisma.users.create({
      data: {
        firebase_uid: 'test-admin-uid',
        email: 'admin@test.com',
        display_name: 'Test Admin',
        is_admin: true
      }
    });

    console.log('Created admin user:', adminUser.email);
    return adminUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();