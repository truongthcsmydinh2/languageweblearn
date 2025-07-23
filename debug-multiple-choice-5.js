const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugMultipleChoice5() {
  try {
    console.log('=== Checking multiple_choice_5 questions ===');
    
    const questions = await prisma.ielts_reading_questions.findMany({
      where: {
        question_type: 'multiple_choice_5'
      },
      include: {
        group: {
          include: {
            passage: true
          }
        }
      },
      take: 5
    });
    
    console.log('Found', questions.length, 'multiple_choice_5 questions');
    
    questions.forEach((question, index) => {
      console.log(`\n--- Question ${index + 1} ---`);
      console.log('ID:', question.id);
      console.log('Question Type:', question.question_type);
      console.log('Question Text:', question.question_text);
      console.log('Options:', question.options);
      console.log('Options Type:', typeof question.options);
      console.log('Options Is Array:', Array.isArray(question.options));
      console.log('Passage:', question.group?.passage?.title);
      
      if (typeof question.options === 'string') {
        try {
          const parsed = JSON.parse(question.options);
          console.log('Parsed Options:', parsed);
          console.log('Parsed Is Array:', Array.isArray(parsed));
        } catch (e) {
          console.log('Failed to parse options as JSON:', e.message);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMultipleChoice5();