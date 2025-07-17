const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixQuestionTypes() {
  try {
    console.log('🔍 Checking question types in database...');
    
    // Lấy tất cả questions để kiểm tra
    const questions = await prisma.ielts_reading_questions.findMany({
      select: {
        id: true,
        question_type: true,
        question_text: true
      }
    });

    console.log(`Found ${questions.length} questions`);
    
    // Kiểm tra các question_type không hợp lệ
    const invalidTypes = questions.filter(q => {
      const validTypes = [
        'multiple_choice',
        'multiple_choice_5', 
        'multiple_choice_group',
        'true_false_not_given',
        'yes_no_not_given',
        'matching_headings',
        'matching_information',
        'matching_features',
        'matching_sentence_endings',
        'sentence_completion',
        'summary_completion',
        'note_completion',
        'table_completion',
        'flow_chart_completion',
        'diagram_labelling',
        'short_answer_questions'
      ];
      return !validTypes.includes(q.question_type);
    });

    console.log(`Found ${invalidTypes.length} questions with invalid types:`);
    invalidTypes.forEach(q => {
      console.log(`  ID: ${q.id}, Type: ${q.question_type}, Text: ${q.question_text.substring(0, 50)}...`);
    });

    // Sửa các question_type không hợp lệ
    if (invalidTypes.length > 0) {
      console.log('\n🔧 Fixing invalid question types...');
      
      for (const question of invalidTypes) {
        let newType = 'multiple_choice'; // default
        
        // Map các loại cũ sang loại mới
        if (question.question_type === 'true_false') {
          newType = 'true_false_not_given';
        } else if (question.question_type === 'fill_blank') {
          newType = 'sentence_completion';
        } else if (question.question_type === 'matching') {
          newType = 'matching_information';
        } else {
          // Dựa vào nội dung câu hỏi để đoán loại
          const text = question.question_text.toLowerCase();
          if (text.includes('true') || text.includes('false') || text.includes('not given')) {
            newType = 'true_false_not_given';
          } else if (text.includes('yes') || text.includes('no')) {
            newType = 'yes_no_not_given';
          } else if (text.includes('match') || text.includes('heading')) {
            newType = 'matching_headings';
          } else if (text.includes('________') || text.includes('blank')) {
            newType = 'sentence_completion';
          }
        }
        
        await prisma.ielts_reading_questions.update({
          where: { id: question.id },
          data: { question_type: newType }
        });
        
        console.log(`  Fixed question ${question.id}: ${question.question_type} → ${newType}`);
      }
      
      console.log('✅ All invalid question types have been fixed!');
    } else {
      console.log('✅ All question types are valid!');
    }

  } catch (error) {
    console.error('❌ Error fixing question types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixQuestionTypes(); 