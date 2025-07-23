const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkImportedData() {
  try {
    // Find the latest passage
    const latestPassage = await prisma.ielts_reading_passages.findFirst({
      orderBy: { created_at: 'desc' },
      include: {
        question_groups: {
          include: {
            questions: true
          }
        }
      }
    });

    if (!latestPassage) {
      console.log('No passages found');
      return;
    }

    console.log('\n📖 Latest Imported Passage:');
    console.log('ID:', latestPassage.id);
    console.log('Title:', latestPassage.title);
    console.log('Level:', latestPassage.level);
    console.log('Category:', latestPassage.category);
    
    console.log('\n📋 Question Groups:');
    latestPassage.question_groups.forEach((group, index) => {
      console.log(`\nGroup ${index + 1}:`);
      console.log('  ID:', group.id);
      console.log('  Type:', group.question_type);
      console.log('  Instructions:', group.instructions?.substring(0, 100) + '...');
      console.log('  Options (raw):', group.options);
      
      // Parse options if it's a JSON string
      if (group.options) {
        try {
          const parsedOptions = typeof group.options === 'string' ? JSON.parse(group.options) : group.options;
          console.log('  Options (parsed):', parsedOptions);
        } catch (e) {
          console.log('  Options (parse error):', e.message);
        }
      }
      
      console.log('  Questions count:', group.questions.length);
      
      group.questions.forEach((question, qIndex) => {
        console.log(`    Question ${qIndex + 1}:`);
        console.log('      Text:', question.question_text?.substring(0, 50) + '...');
        console.log('      Answer:', question.correct_answer);
        console.log('      Options (raw):', question.options);
        
        // Parse question options if it's a JSON string
        if (question.options) {
          try {
            const parsedQOptions = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
            console.log('      Options (parsed):', parsedQOptions);
          } catch (e) {
            console.log('      Options (parse error):', e.message);
          }
        }
      });
    });
    
  } catch (error) {
    console.error('Error checking imported data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImportedData();