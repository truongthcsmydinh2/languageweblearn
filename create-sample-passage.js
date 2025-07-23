const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSamplePassage() {
  try {
    console.log('Creating sample passage...');
    
    // Tạo passage
    const passage = await prisma.ielts_reading_passages.create({
      data: {
        title: 'The Future of Renewable Energy',
        content: `Renewable energy sources such as solar, wind, and hydroelectric power are becoming increasingly important in the global energy mix. As concerns about climate change and fossil fuel depletion grow, governments and businesses worldwide are investing heavily in renewable energy technologies.

Solar energy, which harnesses the power of the sun through photovoltaic cells, has seen remarkable growth in recent years. The cost of solar panels has decreased significantly, making solar power more accessible to homeowners and businesses. In many countries, solar installations have become a common sight on rooftops and in large solar farms.

Wind energy is another rapidly growing renewable source. Modern wind turbines can generate substantial amounts of electricity, and wind farms are being built both onshore and offshore. Countries with strong wind resources, such as Denmark and Germany, have made significant progress in integrating wind power into their energy grids.

Hydroelectric power, while not a new technology, continues to play a vital role in renewable energy production. Large dams and smaller run-of-river projects provide reliable, clean electricity to millions of people worldwide.

The transition to renewable energy is not without challenges. Energy storage remains a critical issue, as renewable sources are often intermittent. However, advances in battery technology and grid management systems are helping to address these challenges.

Despite the obstacles, the future of renewable energy looks promising. With continued technological innovation and policy support, renewable energy sources are expected to play an increasingly dominant role in meeting global energy needs.`,
        level: 'intermediate',
        category: 'Sample Test',
        time_limit: 60,
        is_active: true
      }
    });
    
    console.log('Passage created:', passage.id);
    
    // Tạo question group 1 - Multiple Choice
    const group1 = await prisma.ielts_reading_question_groups.create({
      data: {
        passage_id: passage.id,
        instructions: 'Questions 1-5: Choose the correct letter, A, B, C or D.',
        question_type: 'multiple_choice',
        display_order: 1
      }
    });
    
    console.log('Group 1 created:', group1.id);
    
    // Tạo câu hỏi cho group 1
    const questions1 = [
      {
        question_text: 'What is the main reason for the growing importance of renewable energy?',
        options: ['Decreasing costs of renewable technologies', 'Concerns about climate change and fossil fuel depletion', 'Government subsidies and incentives', 'Public demand for cleaner energy'],
        correct_answer: 'Concerns about climate change and fossil fuel depletion',
        order_index: 1
      },
      {
        question_text: 'Which renewable energy source has become more accessible due to cost reductions?',
        options: ['Wind energy', 'Solar energy', 'Hydroelectric power', 'Geothermal energy'],
        correct_answer: 'Solar energy',
        order_index: 2
      },
      {
        question_text: 'Where are wind farms typically located?',
        options: ['Only onshore', 'Only offshore', 'Both onshore and offshore', 'Only in mountainous regions'],
        correct_answer: 'Both onshore and offshore',
        order_index: 3
      },
      {
        question_text: 'What is the main challenge mentioned for renewable energy?',
        options: ['High initial costs', 'Energy storage', 'Public resistance', 'Limited availability'],
        correct_answer: 'Energy storage',
        order_index: 4
      },
      {
        question_text: 'What is expected to help address energy storage challenges?',
        options: ['Increased government funding', 'Advances in battery technology and grid management', 'Public awareness campaigns', 'International cooperation'],
        correct_answer: 'Advances in battery technology and grid management',
        order_index: 5
      }
    ];
    
    for (const q of questions1) {
      await prisma.ielts_reading_questions.create({
        data: {
          group_id: group1.id,
          question_text: q.question_text,
          question_type: 'multiple_choice',
          options: q.options,
          correct_answer: q.correct_answer,
          order_index: q.order_index
        }
      });
    }
    
    console.log('Questions for group 1 created');
    
    // Tạo question group 2 - True/False/Not Given
    const group2 = await prisma.ielts_reading_question_groups.create({
      data: {
        passage_id: passage.id,
        instructions: 'Questions 6-10: Do the following statements agree with the information given in the reading passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
        question_type: 'true_false_not_given',
        display_order: 2
      }
    });
    
    console.log('Group 2 created:', group2.id);
    
    // Tạo câu hỏi cho group 2
    const questions2 = [
      {
        question_text: 'Solar panels are now commonly installed on rooftops in many countries.',
        correct_answer: 'TRUE',
        order_index: 6
      },
      {
        question_text: 'Denmark and Germany have the strongest wind resources in the world.',
        correct_answer: 'NOT GIVEN',
        order_index: 7
      },
      {
        question_text: 'Hydroelectric power is a relatively new technology.',
        correct_answer: 'FALSE',
        order_index: 8
      },
      {
        question_text: 'All renewable energy sources are intermittent.',
        correct_answer: 'FALSE',
        order_index: 9
      },
      {
        question_text: 'The future of renewable energy depends entirely on technological innovation.',
        correct_answer: 'FALSE',
        order_index: 10
      }
    ];
    
    for (const q of questions2) {
      await prisma.ielts_reading_questions.create({
        data: {
          group_id: group2.id,
          question_text: q.question_text,
          question_type: 'true_false_not_given',
          correct_answer: q.correct_answer,
          order_index: q.order_index
        }
      });
    }
    
    console.log('Questions for group 2 created');
    console.log('Sample passage created successfully!');
    
  } catch (error) {
    console.error('Error creating sample passage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSamplePassage();