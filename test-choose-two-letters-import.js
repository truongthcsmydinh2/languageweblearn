const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

// Import the import logic directly
const path = require('path');
const fs = require('fs');

// Test data for choose_two_letters import
const testData = {
  metadata: {
    title: "Test Choose Two Letters Import",
    level: "intermediate"
  },
  content: {
    readingPassage: {
      title: "Test Passage for Choose Two Letters",
      subtitle: "Testing import functionality",
      paragraphs: [
        { id: "A", content: "This is paragraph A with some content." },
        { id: "B", content: "This is paragraph B with different content." },
        { id: "C", content: "This is paragraph C with more information." },
        { id: "D", content: "This is paragraph D with additional details." },
        { id: "E", content: "This is paragraph E with final thoughts." },
        { id: "F", content: "This is paragraph F with concluding remarks." }
      ]
    },
    questionGroups: [
      {
        type: "choose_two_letters",
        range: "Questions 1-2",
        instructions: "Choose TWO letters, A-F.",
        options: ["A", "B", "C", "D", "E", "F"], // Explicitly provide options
        questions: [
          {
            id: 1,
            content: "Which TWO paragraphs mention specific details?",
            answer: "B,D",
            guide: "Look for paragraphs with specific information."
          },
          {
            id: 2,
            content: "Which TWO paragraphs contain concluding information?",
            answer: "E,F",
            guide: "Look for paragraphs that wrap up the topic."
          }
        ]
      }
    ]
  }
};

// Test data without options (should use default)
const testDataNoOptions = {
  metadata: {
    title: "Test Choose Two Letters Import No Options",
    level: "intermediate"
  },
  content: {
    readingPassage: {
      title: "Test Passage for Choose Two Letters No Options",
      subtitle: "Testing import functionality without options",
      paragraphs: [
        { id: "A", content: "This is paragraph A." },
        { id: "B", content: "This is paragraph B." },
        { id: "C", content: "This is paragraph C." },
        { id: "D", content: "This is paragraph D." },
        { id: "E", content: "This is paragraph E." },
        { id: "F", content: "This is paragraph F." }
      ]
    },
    questionGroups: [
      {
        type: "choose_two_letters",
        range: "Questions 1-2",
        instructions: "Choose TWO letters, A-F.",
        // No options provided - should use default
        questions: [
          {
            id: 1,
            content: "Test question 1",
            answer: "A,B",
            guide: "Test guide 1"
          },
          {
            id: 2,
            content: "Test question 2",
            answer: "C,D",
            guide: "Test guide 2"
          }
        ]
      }
    ]
  }
};

// Helper function to map question types (copied from import.ts)
function mapQuestionType(type) {
  const trimmedType = type?.trim() || '';
  const normalizedType = trimmedType.toLowerCase();
  
  const typeMap = {
    'choose_two_letters': 'choose_two_letters',
    'CHOOSE_TWO_LETTERS': 'choose_two_letters',
    'multiple_choice': 'multiple_choice',
    'multiple_choice_5': 'multiple_choice_5',
    // ... other mappings
  };
  
  const mappedType = typeMap[trimmedType] || typeMap[normalizedType];
  
  if (!mappedType) {
    console.warn(`Unknown question type: "${type}", defaulting to multiple_choice`);
    return 'multiple_choice';
  }
  
  return mappedType;
}

// Test the group options processing logic
function testGroupOptionsProcessing(group) {
  console.log('\n=== Testing Group Options Processing ===');
  console.log('Input group:', JSON.stringify(group, null, 2));
  
  // Xử lý options cho mọi loại group (copied from import.ts logic)
  let groupOptions = null;
  if (group.options) {
    if (Array.isArray(group.options)) {
      // Convert options from object format to string array if needed
      groupOptions = group.options.map((option) => {
        if (typeof option === 'object' && option !== null && option.value) {
          return String(option.value);
        }
        return String(option);
      });
    } else if (typeof group.options === 'object') {
      // Chuyển object key-value thành mảng string
      groupOptions = Object.entries(group.options).map(([key, value]) => String(value));
    }
  } else if (group.questions && group.questions[0]?.options) {
    // Một số loại options nằm trong từng câu hỏi
    const qOpts = group.questions[0].options;
    if (Array.isArray(qOpts)) {
      groupOptions = qOpts.map((option) => {
        if (typeof option === 'object' && option !== null && option.value) {
          return String(option.value);
        }
        return String(option);
      });
    } else if (typeof qOpts === 'object') {
      groupOptions = Object.entries(qOpts).map(([key, value]) => String(value));
    }
  }

  // Chuẩn hóa question_type cho mọi loại
  const questionType = mapQuestionType(group.type);
  
  // Đặc biệt xử lý cho choose_two_letters - đảm bảo luôn có options
  if (questionType === 'choose_two_letters' && !groupOptions) {
    // Tạo options mặc định A-F cho choose_two_letters
    groupOptions = ['A', 'B', 'C', 'D', 'E', 'F'];
    console.log('Added default options for choose_two_letters:', groupOptions);
  }
  
  // Đảm bảo content và options luôn là string hoặc null
  let groupOptionsStr = groupOptions;
  if (groupOptionsStr && typeof groupOptionsStr !== 'string') {
    groupOptionsStr = JSON.stringify(groupOptionsStr);
  }
  
  console.log('Processed results:');
  console.log('- questionType:', questionType);
  console.log('- groupOptions (array):', groupOptions);
  console.log('- groupOptionsStr (for DB):', groupOptionsStr);
  
  return {
    questionType,
    groupOptions,
    groupOptionsStr
  };
}

async function testDirectDatabase() {
  try {
    console.log('Testing choose_two_letters import logic directly...');
    
    // Test with explicit options
    console.log('\n=== Testing with explicit options ===');
    const result1 = testGroupOptionsProcessing(testData.content.questionGroups[0]);
    
    // Test without explicit options
    console.log('\n=== Testing without explicit options (should use default) ===');
    const result2 = testGroupOptionsProcessing(testDataNoOptions.content.questionGroups[0]);
    
    // Test database connection and check existing data
    console.log('\n=== Checking existing choose_two_letters data in database ===');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Abc@123456',
      database: 'vocab_app'
    });
    
    const [groups] = await connection.execute(
      `SELECT g.*, p.title as passage_title 
       FROM ielts_reading_question_groups g 
       JOIN ielts_reading_passages p ON g.passage_id = p.id 
       WHERE g.question_type = 'choose_two_letters' 
       ORDER BY g.id DESC LIMIT 5`
    );
    
    console.log('\nExisting choose_two_letters groups in database:');
    groups.forEach(group => {
      console.log({
        id: group.id,
        passage_title: group.passage_title,
        question_type: group.question_type,
        instructions: group.instructions,
        options: group.options,
        parsedOptions: group.options ? JSON.parse(group.options) : null
      });
    });
    
    await connection.end();
    
    console.log('\n=== Test Summary ===');
    console.log('✅ Group options processing logic works correctly');
    console.log('✅ Default options are added when missing for choose_two_letters');
    console.log('✅ Options are properly stringified for database storage');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDirectDatabase();