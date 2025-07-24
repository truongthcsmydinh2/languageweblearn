const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQuestionText() {
  try {
    const questions = await prisma.ielts_reading_question.findMany({
      where: {
        question_type: 'choose_two_letters'
      },
      select: {
        id: true,
        question_text: true,
        content: true
      }
    });
    
    console.log('Choose two letters questions:');
    questions.forEach(q => {
      console.log('ID:', q.id);
      console.log('Question text:', q.question_text);
      console.log('Content:', q.content);
      
      // Check if question text contains "Answer:"
      if (q.question_text && q.question_text.includes('Answer:')) {
        console.log('*** FOUND LEAKED ANSWER IN QUESTION TEXT ***');
      }
      if (q.content && q.content.includes('Answer:')) {
        console.log('*** FOUND LEAKED ANSWER IN CONTENT ***');
      }
      
      console.log('---');
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkQuestionText();