const fs = require('fs');

// Đọc file datademo.json
const jsonData = JSON.parse(fs.readFileSync('demodata/cam 19 reading test 1 read 2.json', 'utf8'));

console.log('=== DEBUG IMPORT ===');
console.log('Test data keys:', Object.keys(jsonData));

if (jsonData.content && jsonData.content.questionGroups) {
  console.log('Question groups found:', jsonData.content.questionGroups.length);
  
  jsonData.content.questionGroups.forEach((group, index) => {
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
    // Uppercase variants (from JSON files)
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
    'MULTIPLE_CHOICE_5': 'multiple_choice_5',
    
    // Special combined completion types
    'note_table_flowchart_diagram_completion': 'note_completion',
    'NOTE_TABLE_FLOWCHART_DIAGRAM_COMPLETION': 'note_completion',
    
    // Lowercase variants
    'matching_information': 'matching_information',
    'multiple_choice_multiple_answers': 'multiple_choice_group',
    'completion': 'summary_completion',
    'true_false_not_given': 'true_false_not_given',
    'yes_no_not_given': 'yes_no_not_given',
    'matching_headings': 'matching_headings',
    'matching_features': 'matching_features',
    'matching_sentence_endings': 'matching_sentence_endings',
    'sentence_completion': 'sentence_completion',
    'note_completion': 'note_completion',
    'table_completion': 'table_completion',
    'flow_chart_completion': 'flow_chart_completion',
    'diagram_labelling': 'diagram_labelling',
    'short_answer_questions': 'short_answer_questions',
    'multiple_choice': 'multiple_choice',
    'multiple_choice_5': 'multiple_choice_5',
    'summary_completion': 'summary_completion'
  };
  
  const mappedType = typeMap[type] || 'multiple_choice';
  console.log('Mapped to:', mappedType);
  return mappedType;
}

// Test mapping cho từng group
jsonData.content.questionGroups.forEach((group, index) => {
  console.log(`\nTesting group ${index + 1} (${group.type}):`);
  const mappedType = mapQuestionType(group.type);
  console.log(`Result: ${group.type} -> ${mappedType}`);
});

console.log('\n=== END DEBUG ===');