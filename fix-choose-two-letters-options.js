const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixChooseTwoLettersOptions() {
  try {
    console.log('=== Fixing choose_two_letters options ===');
    
    // Get all choose_two_letters groups
    const groups = await prisma.ielts_reading_question_groups.findMany({
      where: {
        question_type: 'choose_two_letters'
      },
      include: {
        questions: true
      }
    });
    
    console.log('Found', groups.length, 'choose_two_letters groups');
    
    // Default options for choose_two_letters
    const defaultOptions = JSON.stringify([
      'Option A - First choice',
      'Option B - Second choice', 
      'Option C - Third choice',
      'Option D - Fourth choice',
      'Option E - Fifth choice'
    ]);
    
    for (const group of groups) {
      console.log(`\nUpdating group ${group.id}...`);
      
      // Update group options
      await prisma.ielts_reading_question_groups.update({
        where: { id: group.id },
        data: {
          options: defaultOptions
        }
      });
      
      console.log('Updated group options');
      
      // Update each question in the group
      for (const question of group.questions) {
        await prisma.ielts_reading_questions.update({
          where: { id: question.id },
          data: {
            options: defaultOptions
          }
        });
        console.log(`Updated question ${question.id} options`);
      }
    }
    
    console.log('\n=== Verification ===');
    
    // Verify the updates
    const updatedGroups = await prisma.ielts_reading_question_groups.findMany({
      where: {
        question_type: 'choose_two_letters'
      },
      include: {
        questions: true
      }
    });
    
    updatedGroups.forEach((group, index) => {
      console.log(`\nGroup ${index + 1}:`);
      console.log('ID:', group.id);
      console.log('Options:', group.options);
      
      group.questions.forEach((question, qIndex) => {
        console.log(`  Question ${qIndex + 1} (${question.id}): ${question.options ? 'HAS OPTIONS' : 'NO OPTIONS'}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixChooseTwoLettersOptions();