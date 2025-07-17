const fs = require('fs');

// Đọc file datademo.json
const testData = JSON.parse(fs.readFileSync('datademo.json', 'utf8'));

console.log('=== DEBUG IMPORT ===');
console.log('Test data keys:', Object.keys(testData));

if (testData.content && testData.content.questionGroups) {
  console.log('Question groups found:', testData.content.questionGroups.length);
  
  testData.content.questionGroups.forEach((group, index) => {
    console.log(`Group ${index + 1}:`, {
      type: group.type,
      range: group.range,
      questionsCount: group.questions.length
    });
  });
}

// Test hàm mapQuestionType
function mapQuestionType(type) {
  console.log('Mapping type:', type);
  
  const typeMap = {
    'MATCHING_INFORMATION': 'matching_information',
    'MULTIPLE_CHOICE_MULTIPLE_ANSWERS': 'multiple_choice_group',
    'COMPLETION': 'summary_completion',
    'TRUE_FALSE_NOT_GIVEN': 'true_false_not_given',
    'YES_NO_NOT_GIVEN': 'yes_no_not_given',
    'MATCHING_HEADINGS': 'matching_headings',
    'MATCHING_FEATURES': 'matching_features',
    'MATCHING_SENTENCE_ENDINGS': 'matching_sentence_endings',
    'SENTENCE_COMPLETION': 'sentence_completion',
    'NOTE_COMPLETION': 'note_completion',
    'TABLE_COMPLETION': 'table_completion',
    'FLOW_CHART_COMPLETION': 'flow_chart_completion',
    'DIAGRAM_LABELLING': 'diagram_labelling',
    'SHORT_ANSWER_QUESTIONS': 'short_answer_questions',
    'MULTIPLE_CHOICE': 'multiple_choice',
    'MULTIPLE_CHOICE_5': 'multiple_choice_5'
  };
  
  const mappedType = typeMap[type] || 'multiple_choice';
  console.log('Mapped to:', mappedType);
  return mappedType;
}

// Test mapping cho từng group
testData.content.questionGroups.forEach((group, index) => {
  console.log(`\nTesting group ${index + 1} (${group.type}):`);
  const mappedType = mapQuestionType(group.type);
  console.log(`Result: ${group.type} -> ${mappedType}`);
});

console.log('\n=== END DEBUG ==='); 