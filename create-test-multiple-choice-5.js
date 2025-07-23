const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestMultipleChoice5() {
  try {
    console.log('=== Creating test multiple_choice_5 question ===');
    
    // Get first passage and group
    const passage = await prisma.ielts_reading_passages.findFirst({
      include: {
        question_groups: true
      }
    });
    
    if (!passage || !passage.question_groups.length) {
      console.log('No passage or question groups found');
      return;
    }
    
    const group = passage.question_groups[0];
    console.log('Using passage:', passage.title);
    console.log('Using group:', group.id);
    
    // Create test multiple_choice_5 question
    const testQuestion = await prisma.ielts_reading_questions.create({
      data: {
        group_id: group.id,
        question_text: 'Test multiple choice 5 question - Which TWO of the following are mentioned?',
        question_type: 'multiple_choice_5',
        options: JSON.stringify([
          'Option A - First choice',
          'Option B - Second choice', 
          'Option C - Third choice',
          'Option D - Fourth choice',
          'Option E - Fifth choice'
        ]),
        correct_answer: 'A,C',
        order_index: 999
      }
    });
    
    console.log('Created test question:', {
      id: testQuestion.id,
      question_type: testQuestion.question_type,
      options: testQuestion.options,
      optionsType: typeof testQuestion.options
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestMultipleChoice5();