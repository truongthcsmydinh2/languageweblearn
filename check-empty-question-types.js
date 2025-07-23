const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmptyQuestionTypes() {
  try {
    console.log('🔍 Checking and fixing empty question_types...');
    
    // First, let's check the raw data
    console.log('\n📊 Checking raw data in ielts_reading_question_groups...');
    const rawQuery = `SELECT id, question_type, passage_id FROM ielts_reading_question_groups WHERE question_type = '' OR question_type IS NULL`;
    
    try {
      const emptyRecords = await prisma.$queryRaw`SELECT id, question_type, passage_id FROM ielts_reading_question_groups WHERE question_type = '' OR question_type IS NULL`;
      console.log('Empty question_type records found:', emptyRecords.length);
      
      if (emptyRecords.length > 0) {
        console.log('Records with empty question_type:', emptyRecords);
        
        // Update empty records to a default value
        console.log('\n🔧 Updating empty question_type records to multiple_choice...');
        const updateResult = await prisma.$executeRaw`UPDATE ielts_reading_question_groups SET question_type = 'multiple_choice' WHERE question_type = '' OR question_type IS NULL`;
        console.log('Updated records:', updateResult);
      }
    } catch (rawError) {
      console.log('Raw query error:', rawError.message);
    }
    
    // Also check for any invalid enum values in the questions table
    console.log('\n🔍 Checking ielts_reading_questions table...');
    try {
      const invalidQuestions = await prisma.$queryRaw`SELECT id, question_type, group_id FROM ielts_reading_questions WHERE question_type = '' OR question_type IS NULL`;
      console.log('Invalid question records found:', invalidQuestions.length);
      
      if (invalidQuestions.length > 0) {
        console.log('Records with invalid question_type:', invalidQuestions);
        
        // Update invalid records
        console.log('\n🔧 Updating invalid question_type records to multiple_choice...');
        const updateResult = await prisma.$executeRaw`UPDATE ielts_reading_questions SET question_type = 'multiple_choice' WHERE question_type = '' OR question_type IS NULL`;
        console.log('Updated question records:', updateResult);
      }
    } catch (questionError) {
      console.log('Question query error:', questionError.message);
    }
    
    // Now try to fetch all groups using Prisma to see if there are still issues
    console.log('\n✅ Testing Prisma query after fixes...');
    try {
      const allGroups = await prisma.ielts_reading_question_groups.findMany({
        select: {
          id: true,
          question_type: true,
          passage_id: true
        }
      });
      console.log('Successfully fetched groups via Prisma:', allGroups.length);
      
      // Show unique question types
      const uniqueTypes = [...new Set(allGroups.map(g => g.question_type))];
      console.log('Unique question types:', uniqueTypes);
      
    } catch (prismaError) {
      console.log('Prisma query still failing:', prismaError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmptyQuestionTypes();