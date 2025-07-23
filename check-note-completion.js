const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNoteCompletion() {
  try {
    console.log('Checking note completion data...');
    
    // Tìm group note completion
    const group = await prisma.ielts_reading_question_groups.findFirst({
      where: { question_type: 'note_completion' },
      include: { questions: true }
    });
    
    if (group) {
      console.log('Note completion group found:');
      console.log('ID:', group.id);
      console.log('Instructions:', group.instructions);
      console.log('Content:', group.content);
      console.log('Questions count:', group.questions.length);
      
      group.questions.forEach((q, index) => {
        console.log(`Question ${index + 1}:`, {
          id: q.id,
          order_index: q.order_index,
          question_text: q.question_text,
          correct_answer: q.correct_answer
        });
      });
    } else {
      console.log('No note completion group found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNoteCompletion();