const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixChooseTwoLettersOptions() {
  try {
    console.log('🔍 Checking choose_two_letters questions...');
    
    // Find all choose_two_letters groups
    const groups = await prisma.ielts_reading_question_groups.findMany({
      where: {
        question_type: 'choose_two_letters'
      },
      include: {
        questions: true
      }
    });
    
    console.log(`📊 Found ${groups.length} choose_two_letters groups`);
    
    // Default options A-E
    const defaultOptions = [
      "A. First option",
      "B. Second option", 
      "C. Third option",
      "D. Fourth option",
      "E. Fifth option"
    ];
    
    for (const group of groups) {
      console.log(`\n🔧 Processing group ${group.id}:`);
      console.log(`   Instructions: ${group.instructions}`);
      console.log(`   Current options: ${group.options}`);
      console.log(`   Questions count: ${group.questions.length}`);
      
      // Update group options if null
      if (!group.options || group.options === 'null') {
        await prisma.ielts_reading_question_groups.update({
          where: { id: group.id },
          data: {
            options: JSON.stringify(defaultOptions)
          }
        });
        console.log(`   ✅ Updated group options`);
      } else {
        console.log(`   ℹ️  Group already has options`);
      }
      
      // Update individual questions if they have empty options
      for (const question of group.questions) {
        console.log(`   Question ${question.id}: options = ${question.options}`);
        
        if (!question.options || question.options === '[]' || question.options === 'null') {
          await prisma.ielts_reading_questions.update({
            where: { id: question.id },
            data: {
              options: JSON.stringify(defaultOptions)
            }
          });
          console.log(`   ✅ Updated question ${question.id} options`);
        }
      }
    }
    
    console.log('\n🎉 Fix completed successfully!');
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const updatedGroups = await prisma.ielts_reading_question_groups.findMany({
      where: {
        question_type: 'choose_two_letters'
      },
      include: {
        questions: true
      }
    });
    
    for (const group of updatedGroups) {
      console.log(`\nGroup ${group.id}:`);
      console.log(`  Options: ${group.options}`);
      
      let parsedOptions;
      try {
        parsedOptions = JSON.parse(group.options || '[]');
        console.log(`  Parsed options count: ${parsedOptions.length}`);
        console.log(`  Options: ${parsedOptions.join(', ')}`);
      } catch (e) {
        console.log(`  ❌ Failed to parse options: ${e.message}`);
      }
      
      for (const question of group.questions) {
        try {
          const qOptions = JSON.parse(question.options || '[]');
          console.log(`  Question ${question.id}: ${qOptions.length} options`);
        } catch (e) {
          console.log(`  Question ${question.id}: Failed to parse options`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixChooseTwoLettersOptions();