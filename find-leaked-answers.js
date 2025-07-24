const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findLeakedAnswers() {
  try {
    console.log('Searching for questions with leaked answers...');
    
    // Tìm các câu hỏi choose_two_letters
    const questions = await prisma.ielts_reading_question.findMany({
      where: {
        question_type: 'choose_two_letters'
      },
      select: {
        id: true,
        question_text: true,
        content: true,
        correct_answer: true
      }
    });
    
    console.log(`Found ${questions.length} choose_two_letters questions`);
    
    let foundLeaked = false;
    
    for (const question of questions) {
      const questionText = question.question_text || '';
      const content = question.content || '';
      
      // Kiểm tra xem có chứa "Answer:" không
      if (questionText.includes('Answer:') || content.includes('Answer:')) {
        console.log('\n*** FOUND LEAKED ANSWER ***');
        console.log('Question ID:', question.id);
        console.log('Question Text:', questionText);
        console.log('Content:', content);
        console.log('Correct Answer:', question.correct_answer);
        console.log('---');
        foundLeaked = true;
      }
      
      // Kiểm tra xem có chứa pattern "Answer: [chữ cái]" không
      const answerPattern = /Answer:\s*[A-Z]/i;
      if (answerPattern.test(questionText) || answerPattern.test(content)) {
        console.log('\n*** FOUND ANSWER PATTERN ***');
        console.log('Question ID:', question.id);
        console.log('Question Text:', questionText);
        console.log('Content:', content);
        console.log('Correct Answer:', question.correct_answer);
        console.log('---');
        foundLeaked = true;
      }
    }
    
    if (!foundLeaked) {
      console.log('No leaked answers found in question_text or content fields.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findLeakedAnswers();