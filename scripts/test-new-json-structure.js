const fs = require('fs');
const path = require('path');

// Đọc file JSON mẫu
const testData = JSON.parse(fs.readFileSync(path.join(__dirname, '../test-new-structure.json'), 'utf8'));

console.log('=== TESTING NEW JSON STRUCTURE ===');
console.log('Metadata:', {
  id: testData.metadata.id,
  title: testData.metadata.title,
  link: testData.metadata.link
});

console.log('\nReading Passage:', {
  title: testData.content.readingPassage.title,
  paragraphsCount: testData.content.readingPassage.paragraphs.length
});

console.log('\nQuestion Groups:', testData.content.questionGroups.length);
testData.content.questionGroups.forEach((group, index) => {
  console.log(`Group ${index + 1}:`, {
    type: group.type,
    range: group.range,
    questionsCount: group.questions.length
  });
});

console.log('\nSummary:', {
  totalQuestions: testData.summary.total_questions,
  questionTypes: testData.summary.question_types
});

// Test API call
async function testImport() {
  try {
    console.log('\n=== TESTING API IMPORT ===');
    
    const response = await fetch('http://localhost:3000/api/admin/ielts-reading/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Import result:', result);
    
    if (response.ok) {
      console.log('✅ Import successful!');
      console.log(`Passages created: ${result.passagesCreated}`);
      console.log(`Questions created: ${result.questionsCreated}`);
    } else {
      console.log('❌ Import failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error testing import:', error);
  }
}

// Chạy test nếu được gọi trực tiếp
if (require.main === module) {
  testImport();
}

module.exports = { testData, testImport }; 