const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Function to extract Cam and Test info
function extractCamTestInfo(metadataTitle) {
  if (!metadataTitle) return null;
  
  const camTestMatch = metadataTitle.match(/(Cambridge IELTS \d+|Cam \d+).*?(Test \d+)/i);
  if (camTestMatch) {
    const camInfo = camTestMatch[1].replace('Cambridge IELTS', 'Cam');
    const testInfo = camTestMatch[2];
    
    // Extract Reading Passage number if available
    const passageMatch = metadataTitle.match(/Reading Passage (\d+)/i);
    const passageInfo = passageMatch ? `Reading Passage ${passageMatch[1]}` : '';
    
    return {
      camInfo,
      testInfo,
      passageInfo
    };
  }
  
  return null;
}

// Function to enhance title
function enhanceTitle(originalTitle, metadataTitle) {
  const camTestInfo = extractCamTestInfo(metadataTitle);
  
  if (camTestInfo) {
    if (camTestInfo.passageInfo) {
      return `${camTestInfo.camInfo} ${camTestInfo.testInfo} ${camTestInfo.passageInfo}: ${originalTitle}`;
    } else {
      return `${camTestInfo.camInfo} ${camTestInfo.testInfo}: ${originalTitle}`;
    }
  }
  
  return originalTitle;
}

// Map question types
function mapQuestionType(type) {
  const typeMap = {
    'true_false_not_given': 'true_false_not_given',
    'summary_completion': 'summary_completion',
    'multiple_choice': 'multiple_choice',
    'multiple_choice_5': 'multiple_choice_5',
    'multiple_choice_group': 'multiple_choice_group',
    'note_completion': 'note_completion',
    'sentence_completion': 'sentence_completion',
    'matching_headings': 'matching_headings',
    'matching_information': 'matching_information',
    'matching_features': 'matching_features',
    'matching_sentence_endings': 'matching_sentence_endings',
    'table_completion': 'table_completion',
    'flow_chart_completion': 'flow_chart_completion',
    'diagram_labelling': 'diagram_labelling',
    'short_answer_questions': 'short_answer_questions',
    'yes_no_not_given': 'yes_no_not_given'
  };
  
  return typeMap[type] || 'multiple_choice';
}

async function importPassage() {
  try {
    console.log('=== IMPORTING WITH FULL DATA ===');
    
    // Read the JSON file
    const filePath = path.join(__dirname, 'demodata', 'cam 19 reading test 1 read 1.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const metadata = data.metadata;
    const readingPassage = data.content.readingPassage;
    const questionGroups = data.content.questionGroups || [];
    
    // Enhance title
    let passageTitle = readingPassage.title || 'Imported Reading Passage';
    
    if (metadata.title) {
      passageTitle = enhanceTitle(passageTitle, metadata.title);
    }
    
    console.log('Enhanced title:', passageTitle);
    
    // Check if passage already exists
    const existingPassage = await prisma.ielts_reading_passages.findFirst({
      where: {
        title: passageTitle
      }
    });
    
    if (existingPassage) {
      console.log('Passage already exists with ID:', existingPassage.id);
      console.log('Deleting existing passage...');
      await prisma.ielts_reading_passages.delete({
        where: { id: existingPassage.id }
      });
      console.log('✅ Deleted existing passage');
    }
    
    // Process content
    let passageContent = '';
    if (Array.isArray(readingPassage.paragraphs)) {
      passageContent = readingPassage.paragraphs.map((p) => {
        const paragraphId = p.id ? `[${p.id}] ` : '';
        return paragraphId + p.content;
      }).join('\n\n');
    } else {
      passageContent = readingPassage.content || '';
    }
    
    // Create passage
    const passageRecord = await prisma.ielts_reading_passages.create({
      data: {
        title: passageTitle,
        passage_data: {
          title: passageTitle,
          content: passageContent,
          level: 'intermediate',
          timeLimit: 60
        },
        summary: metadata || {},
        level: 'intermediate',
        category: 'reading',
        time_limit: 60,
        is_active: true,
        content: passageContent
      }
    });
    
    console.log('Created passage with ID:', passageRecord.id);
    
    // Process question groups
    let totalQuestions = 0;
    for (let groupIndex = 0; groupIndex < questionGroups.length; groupIndex++) {
      const group = questionGroups[groupIndex];
      if (!group.questions || !Array.isArray(group.questions)) continue;
      
      console.log(`Processing group ${groupIndex + 1}: ${group.type}`);
      
      const questionType = mapQuestionType(group.type);
      
      const groupRecord = await prisma.ielts_reading_question_groups.create({
        data: {
          instructions: group.instructions || group.name || 'No instructions',
          question_type: questionType,
          display_order: groupIndex + 1,
          passage_id: passageRecord.id,
          options: group.options ? JSON.stringify(group.options) : null,
          content: group.contentSegments ? JSON.stringify(group.contentSegments) : null
        }
      });
      
      // Create questions
      const questionsToCreate = group.questions.map((question, i) => {
        let processedOptions = null;
        if (Array.isArray(question.options)) {
          const convertedOptions = question.options.map((option) => {
            if (typeof option === 'object' && option !== null && option.value) {
              return String(option.value);
            }
            return String(option);
          });
          processedOptions = JSON.stringify(convertedOptions);
        } else if (question.options) {
          processedOptions = JSON.stringify(question.options);
        }
        
        return {
          group_id: groupRecord.id,
          question_text: question.questionText || '',
          question_type: questionType,
          options: processedOptions,
          correct_answer: question.answer || '',
          explanation: question.guide || null,
          order_index: question.questionNumber || (i + 1)
        };
      });
      
      if (questionsToCreate.length > 0) {
        await prisma.ielts_reading_questions.createMany({
          data: questionsToCreate,
          skipDuplicates: true
        });
        totalQuestions += questionsToCreate.length;
        console.log(`Created ${questionsToCreate.length} questions for group ${groupIndex + 1}`);
      }
    }
    
    console.log('\n=== IMPORT COMPLETED ===');
    console.log('Passage ID:', passageRecord.id);
    console.log('Title:', passageTitle);
    console.log('Total questions:', totalQuestions);
    console.log('Question groups:', questionGroups.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importPassage();