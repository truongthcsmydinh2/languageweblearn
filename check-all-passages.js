const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllPassages() {
  try {
    console.log('=== CHECKING ALL IELTS READING PASSAGES ===');
    
    const passages = await prisma.ielts_reading_passages.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        created_at: true,
        is_active: true,
        _count: {
          select: {
            question_groups: true
          }
        }
      }
    });
    
    console.log(`Found ${passages.length} passages:\n`);
    
    passages.forEach((passage, index) => {
      console.log(`${index + 1}. ID: ${passage.id}`);
      console.log(`   Title: ${passage.title}`);
      console.log(`   Active: ${passage.is_active}`);
      console.log(`   Question Groups: ${passage._count.question_groups}`);
      console.log(`   Created: ${passage.created_at.toISOString()}`);
      console.log('');
    });
    
    // Check specifically for "How tennis rackets have changed" related passages
    console.log('=== SEARCHING FOR "How tennis rackets have changed" ===');
    const tennisPassages = passages.filter(p => 
      p.title.toLowerCase().includes('tennis') || 
      p.title.toLowerCase().includes('racket')
    );
    
    if (tennisPassages.length > 0) {
      console.log('Found tennis-related passages:');
      tennisPassages.forEach(p => {
        console.log(`- ID ${p.id}: ${p.title}`);
      });
    } else {
      console.log('No tennis-related passages found.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPassages();