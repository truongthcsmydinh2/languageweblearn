const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    console.log('Checking for duplicate question groups...');
    
    // Check for duplicate question groups
    const duplicateGroups = await prisma.$queryRaw`
      SELECT passage_id, display_order, COUNT(*) as count 
      FROM ielts_reading_question_groups 
      GROUP BY passage_id, display_order 
      HAVING count > 1
    `;
    
    console.log('Duplicate question groups:', duplicateGroups);
    
    console.log('\nChecking for duplicate questions...');
    
    // Check for duplicate questions
    const duplicateQuestions = await prisma.$queryRaw`
      SELECT group_id, order_index, COUNT(*) as count 
      FROM ielts_reading_questions 
      GROUP BY group_id, order_index 
      HAVING count > 1
    `;
    
    console.log('Duplicate questions:', duplicateQuestions);
    
    if (duplicateGroups.length === 0 && duplicateQuestions.length === 0) {
      console.log('\n✅ No duplicates found. Safe to apply migration.');
    } else {
      console.log('\n⚠️  Duplicates found. Need to clean up before migration.');
      
      if (duplicateGroups.length > 0) {
        console.log('\nCleaning up duplicate question groups...');
        for (const dup of duplicateGroups) {
          // Keep the first one, delete the rest
          const groups = await prisma.ielts_reading_question_groups.findMany({
            where: {
              passage_id: dup.passage_id,
              display_order: dup.display_order
            },
            orderBy: { id: 'asc' }
          });
          
          // Delete all but the first
          for (let i = 1; i < groups.length; i++) {
            await prisma.ielts_reading_question_groups.delete({
              where: { id: groups[i].id }
            });
            console.log(`Deleted duplicate group ${groups[i].id}`);
          }
        }
      }
      
      if (duplicateQuestions.length > 0) {
        console.log('\nCleaning up duplicate questions...');
        for (const dup of duplicateQuestions) {
          // Keep the first one, delete the rest
          const questions = await prisma.ielts_reading_questions.findMany({
            where: {
              group_id: dup.group_id,
              order_index: dup.order_index
            },
            orderBy: { id: 'asc' }
          });
          
          // Delete all but the first
          for (let i = 1; i < questions.length; i++) {
            await prisma.ielts_reading_questions.delete({
              where: { id: questions[i].id }
            });
            console.log(`Deleted duplicate question ${questions[i].id}`);
          }
        }
      }
      
      console.log('\n✅ Cleanup completed. Now safe to apply migration.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();