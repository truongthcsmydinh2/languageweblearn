const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPassage85() {
  try {
    const passage = await prisma.ielts_reading_passages.findUnique({
      where: { id: 85 }
    });
    
    if (passage) {
      console.log('=== PASSAGE 85 INFO ===');
      console.log('ID:', passage.id);
      console.log('Title:', passage.title);
      console.log('Created at:', passage.created_at);
      console.log('Updated at:', passage.updated_at);
      
      // Check if title needs updating
      const expectedTitle = 'Cam 19 Test 1 Reading Passage 1: How tennis rackets have changed';
      if (passage.title !== expectedTitle) {
        console.log('\n❌ Title needs updating!');
        console.log('Current:', passage.title);
        console.log('Expected:', expectedTitle);
        
        // Update the title
        const updated = await prisma.ielts_reading_passages.update({
          where: { id: 85 },
          data: { title: expectedTitle }
        });
        
        console.log('\n✅ Title updated successfully!');
        console.log('New title:', updated.title);
      } else {
        console.log('\n✅ Title is already correct!');
      }
    } else {
      console.log('❌ Passage with ID 85 not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassage85();