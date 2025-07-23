const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugChooseTwoLetters() {
  try {
    console.log('=== Checking choose_two_letters questions ===');
    
    const questions = await prisma.ielts_reading_questions.findMany({
      where: {
        question_type: 'choose_two_letters'
      },
      include: {
        group: {
          include: {
            passage: true
          }
        }
      }
    });
    
    console.log('Found', questions.length, 'choose_two_letters questions');
    
    questions.forEach((question, index) => {
      console.log(`\n--- Question ${index + 1} ---`);
      console.log('ID:', question.id);
      console.log('Question Type:', question.question_type);
      console.log('Question Text:', question.question_text);
      console.log('Options:', question.options);
      console.log('Options Type:', typeof question.options);
      console.log('Options Is Array:', Array.isArray(question.options));
      console.log('Passage:', question.group?.passage?.title);
      
      if (question.options) {
        try {
          const parsed = JSON.parse(question.options);
          console.log('Parsed Options:', parsed);
          console.log('Parsed Is Array:', Array.isArray(parsed));
        } catch (e) {
          console.log('Failed to parse options as JSON');
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChooseTwoLetters();