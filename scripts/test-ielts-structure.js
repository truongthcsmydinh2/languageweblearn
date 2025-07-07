const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testIeltsStructure() {
  try {
    console.log('🔍 Testing IELTS Reading structure...');

    // Test 1: Kiểm tra các model mới
    console.log('\n📋 Checking models...');
    
    const passages = await prisma.ielts_reading_passages.findMany({
      take: 3,
      include: {
        question_groups: {
          include: {
            questions: true
          }
        }
      }
    });

    console.log(`Found ${passages.length} passages`);
    
    for (const passage of passages) {
      console.log(`\n📖 Passage: ${passage.title}`);
      console.log(`   Groups: ${passage.question_groups.length}`);
      
      for (const group of passage.question_groups) {
        console.log(`   📝 Group: ${group.instructions.substring(0, 50)}...`);
        console.log(`      Questions: ${group.questions.length}`);
        console.log(`      Type: ${group.question_type}`);
      }
    }

    // Test 2: Tạo một passage test với cấu trúc mới
    console.log('\n🧪 Creating test passage...');
    
    const testPassage = await prisma.ielts_reading_passages.create({
      data: {
        title: 'Test Passage - New Structure',
        content: 'This is a test passage for the new IELTS structure.',
        level: 'intermediate',
        category: 'test',
        time_limit: 20,
        is_active: true
      }
    });

    console.log(`Created test passage with ID: ${testPassage.id}`);

    // Test 3: Tạo question groups
    console.log('\n📝 Creating question groups...');
    
    const group1 = await prisma.ielts_reading_question_groups.create({
      data: {
        instructions: 'Questions 1-5: Do the following statements agree with the information given in the reading passage?',
        question_type: 'true_false_not_given',
        display_order: 1,
        passage_id: testPassage.id
      }
    });

    const group2 = await prisma.ielts_reading_question_groups.create({
      data: {
        instructions: 'Questions 6-10: Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        question_type: 'summary_completion',
        display_order: 2,
        passage_id: testPassage.id
      }
    });

    console.log(`Created groups: ${group1.id}, ${group2.id}`);

    // Test 4: Tạo questions
    console.log('\n❓ Creating questions...');
    
    const questions1 = await prisma.ielts_reading_questions.createMany({
      data: [
        {
          group_id: group1.id,
          question_text: 'The new structure is working correctly.',
          question_type: 'true_false_not_given',
          correct_answer: 'TRUE',
          order_index: 1
        },
        {
          group_id: group1.id,
          question_text: 'The old structure is still being used.',
          question_type: 'true_false_not_given',
          correct_answer: 'FALSE',
          order_index: 2
        }
      ]
    });

    const questions2 = await prisma.ielts_reading_questions.createMany({
      data: [
        {
          group_id: group2.id,
          question_text: 'The new structure uses ________ to organize questions.',
          question_type: 'summary_completion',
          correct_answer: 'groups',
          order_index: 1
        },
        {
          group_id: group2.id,
          question_text: 'Each group has its own ________ and question type.',
          question_type: 'summary_completion',
          correct_answer: 'instructions',
          order_index: 2
        }
      ]
    });

    console.log(`Created questions: ${questions1.count} in group 1, ${questions2.count} in group 2`);

    // Test 5: Lấy dữ liệu với cấu trúc mới
    console.log('\n📊 Retrieving data with new structure...');
    
    const retrievedPassage = await prisma.ielts_reading_passages.findUnique({
      where: { id: testPassage.id },
      include: {
        question_groups: {
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
        }
      }
    });

    console.log(`Retrieved passage: ${retrievedPassage.title}`);
    console.log(`Groups: ${retrievedPassage.question_groups.length}`);
    
    for (const group of retrievedPassage.question_groups) {
      console.log(`  Group ${group.display_order}: ${group.instructions.substring(0, 40)}...`);
      console.log(`    Questions: ${group.questions.length}`);
      for (const question of group.questions) {
        console.log(`      - ${question.question_text.substring(0, 30)}...`);
      }
    }

    // Test 6: Dọn dẹp test data
    console.log('\n🧹 Cleaning up test data...');
    
    await prisma.ielts_reading_passages.delete({
      where: { id: testPassage.id }
    });

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testIeltsStructure(); 