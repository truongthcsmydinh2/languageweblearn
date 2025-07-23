const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createNoteCompletionPassage() {
  try {
    console.log('Creating note completion passage...');
    
    // Tạo passage
    const passage = await prisma.ielts_reading_passages.create({
      data: {
        title: 'The Impact of Social Media on Modern Communication',
        content: `Social media platforms have fundamentally transformed the way people communicate in the 21st century. These digital networks, including Facebook, Twitter, Instagram, and LinkedIn, have created unprecedented opportunities for global connectivity and information sharing.

The rise of social media has brought numerous benefits to society. Instant communication across vast distances has become possible, allowing families and friends to stay connected regardless of geographical barriers. Businesses have also leveraged these platforms for marketing and customer engagement, reaching wider audiences than ever before.

However, the widespread adoption of social media has also introduced significant challenges. Privacy concerns have become paramount as personal data is collected and analyzed by platform operators. Additionally, the spread of misinformation has emerged as a critical issue, with false information traveling faster than verified news.

The psychological impact of social media usage cannot be ignored. Studies have shown that excessive use can lead to anxiety, depression, and social comparison issues, particularly among young people. The constant need for validation through likes and comments has created a new form of social pressure.

Despite these challenges, social media continues to evolve and adapt. New features focused on mental health awareness and fact-checking are being implemented to address some of the negative consequences. The future of social media will likely involve more sophisticated content moderation and enhanced privacy protection measures.`,
        level: 'intermediate',
        category: 'Technology',
        time_limit: 60,
        is_active: true
      }
    });
    
    console.log('Passage created:', passage.id);
    
    // Tạo question group với note completion
    const group = await prisma.ielts_reading_question_groups.create({
      data: {
        passage_id: passage.id,
        instructions: 'Complete the notes below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
        question_type: 'note_completion',
        display_order: 1,
        content: JSON.stringify([
          { "type": "text", "value": "Social Media Impact Notes\n\nBenefits:\n• Enables " },
          { "type": "blank", "questionId": 1 },
          { "type": "text", "value": " across vast distances\n• Helps businesses with " },
          { "type": "blank", "questionId": 2 },
          { "type": "text", "value": " and customer engagement\n\nChallenges:\n• " },
          { "type": "blank", "questionId": 3 },
          { "type": "text", "value": " have become a major issue\n• " },
          { "type": "blank", "questionId": 4 },
          { "type": "text", "value": " spreads faster than verified news\n\nPsychological Effects:\n• Can cause " },
          { "type": "blank", "questionId": 5 },
          { "type": "text", "value": ", depression, and social comparison issues\n• Creates new form of " },
          { "type": "blank", "questionId": 6 },
          { "type": "text", "value": " through likes and comments" }
        ])
      }
    });
    
    console.log('Group created:', group.id);
    
    // Tạo câu hỏi cho group
    const questions = [
      {
        question_text: 'instant communication',
        correct_answer: 'instant communication',
        order_index: 1
      },
      {
        question_text: 'marketing',
        correct_answer: 'marketing',
        order_index: 2
      },
      {
        question_text: 'Privacy concerns',
        correct_answer: 'Privacy concerns',
        order_index: 3
      },
      {
        question_text: 'false information',
        correct_answer: 'false information',
        order_index: 4
      },
      {
        question_text: 'anxiety',
        correct_answer: 'anxiety',
        order_index: 5
      },
      {
        question_text: 'social pressure',
        correct_answer: 'social pressure',
        order_index: 6
      }
    ];
    
    for (const q of questions) {
      await prisma.ielts_reading_questions.create({
        data: {
          group_id: group.id,
          question_text: q.question_text,
          question_type: 'note_completion',
          correct_answer: q.correct_answer,
          order_index: q.order_index
        }
      });
    }
    
    console.log('Questions created');
    console.log('Note completion passage created successfully!');
    
  } catch (error) {
    console.error('Error creating note completion passage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNoteCompletionPassage();