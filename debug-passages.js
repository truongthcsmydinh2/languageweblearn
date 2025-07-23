const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPassages() {
  try {
    console.log('Checking passages in database...');
    
    // Kiểm tra tất cả passages
    const allPassages = await prisma.ielts_reading_passages.findMany();
    console.log(`Total passages in database: ${allPassages.length}`);
    
    allPassages.forEach(p => {
      console.log(`- ID: ${p.id}, Title: ${p.title}, Active: ${p.is_active}`);
    });
    
    // Kiểm tra passages active
    const activePassages = await prisma.ielts_reading_passages.findMany({
      where: { is_active: true }
    });
    console.log(`\nActive passages: ${activePassages.length}`);
    
    if (activePassages.length === 0) {
      console.log('No active passages found. Updating all passages to active...');
      await prisma.ielts_reading_passages.updateMany({
        data: { is_active: true }
      });
      console.log('All passages updated to active.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassages();