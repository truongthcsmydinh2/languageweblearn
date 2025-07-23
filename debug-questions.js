const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugQuestions() {
  try {
    console.log('=== Checking IELTS Reading Data ===');
    
    // Kiểm tra passages
    const passages = await prisma.ielts_reading_passages.findMany({
      select: {
        id: true,
        title: true,
        is_active: true
      }
    });
    console.log('\n📚 Passages:', passages);
    
    // Kiểm tra question groups
    const questionGroups = await prisma.ielts_reading_question_groups.findMany({
      select: {
        id: true,
        passage_id: true,
        question_type: true,
        display_order: true,
        instructions: true
      }
    });
    console.log('\n📝 Question Groups:', questionGroups);
    
    // Kiểm tra questions
    const questions = await prisma.ielts_reading_questions.findMany({
      select: {
        id: true,
        group_id: true,
        question_text: true,
        question_type: true,
        correct_answer: true,
        order_index: true
      }
    });
    console.log('\n❓ Questions:', questions);
    
    // Kiểm tra chi tiết cho passage ID 2
    if (passages.length > 0) {
      const passageId = passages[0].id;
      console.log(`\n🔍 Detailed check for passage ID ${passageId}:`);
      
      const detailedGroups = await prisma.ielts_reading_question_groups.findMany({
        where: { passage_id: passageId },
        include: {
          questions: {
            orderBy: {
              order_index: 'asc'
            }
          }
        },
        orderBy: {
          display_order: 'asc'
        }
      });
      
      console.log('Groups with questions:', JSON.stringify(detailedGroups, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuestions();