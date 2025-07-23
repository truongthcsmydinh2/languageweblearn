const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugGroupOptions() {
  try {
    console.log('=== Checking group options for choose_two_letters ===');
    
    const groups = await prisma.ielts_reading_question_groups.findMany({
      where: {
        questions: {
          some: {
            question_type: 'choose_two_letters'
          }
        }
      },
      include: {
        questions: {
          where: {
            question_type: 'choose_two_letters'
          }
        },
        passage: true
      }
    });
    
    console.log('Found', groups.length, 'groups with choose_two_letters questions');
    
    groups.forEach((group, index) => {
      console.log(`\n--- Group ${index + 1} ---`);
      console.log('Group ID:', group.id);
      console.log('Group Type:', group.question_type);
      console.log('Group Options:', group.options);
      console.log('Group Options Type:', typeof group.options);
      console.log('Group Content:', group.content);
      console.log('Passage:', group.passage?.title);
      console.log('Questions in group:', group.questions.length);
      
      if (group.options) {
        try {
          const parsed = JSON.parse(group.options);
          console.log('Parsed Group Options:', parsed);
          console.log('Parsed Is Array:', Array.isArray(parsed));
        } catch (e) {
          console.log('Failed to parse group options as JSON');
        }
      }
      
      group.questions.forEach((question, qIndex) => {
        console.log(`  Question ${qIndex + 1}: ID ${question.id}, Type: ${question.question_type}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugGroupOptions();