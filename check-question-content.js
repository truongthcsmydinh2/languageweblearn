const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkQuestionContent() {
  try {
    console.log('Checking question content for choose_two_letters...');
    
    // Find all question groups with choose_two_letters type
    const groups = await prisma.questionGroup.findMany({
      where: {
        question_type: 'choose_two_letters'
      },
      include: {
        questions: true
      }
    });
    
    console.log(`Found ${groups.length} choose_two_letters groups`);
    
    for (const group of groups) {
      console.log(`\n=== Group ${group.id} ===`);
      console.log('Group question_type:', group.question_type);
      
      for (const question of group.questions) {
        console.log(`\n--- Question ${question.id} ---`);
        console.log('Question type:', question.question_type);
        console.log('Question text:', question.question_text);
        console.log('Content:', question.content);
        console.log('Answer:', question.answer);
        
        // Check if question_text or content contains "Answer:"
        const questionText = question.question_text || '';
        const content = question.content || '';
        
        if (questionText.includes('Answer:') || content.includes('Answer:')) {
          console.log('🚨 FOUND LEAKED ANSWER in question text/content!');
          console.log('Full question_text:', questionText);
          console.log('Full content:', content);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestionContent();