const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPassages() {
  try {
    const passages = await prisma.ielts_reading_passages.findMany({
      select: {
        id: true,
        title: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log('Current passages in database:');
    console.log('Total passages:', passages.length);
    console.log('\n--- Passage Details ---');
    
    passages.forEach((p, index) => {
      console.log(`${index + 1}. ID: ${p.id}`);
      console.log(`   Title: ${p.title}`);
      console.log(`   Created: ${p.created_at}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassages();