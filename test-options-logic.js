// Test script to verify options logic for choose_two_letters
// Since we can't easily import TS files, we'll simulate the logic

// Simulate cleanQuestionGroup logic
function cleanQuestionGroup(group) {
  const instructions = String(group.instructions || group.content || '').trim();
  
  // Process group options
  let groupOptions = null;
  if (group.options) {
    if (Array.isArray(group.options)) {
      groupOptions = group.options.map((option) => {
        if (typeof option === 'object' && option !== null && option.value) {
          return String(option.value);
        }
        return String(option);
      });
    } else if (typeof group.options === 'object') {
      groupOptions = Object.entries(group.options).map(([key, value]) => String(value));
    }
  }
  
  // Auto-generate options for choose_two_letters if missing
  const groupType = String(group.type || '').trim().toLowerCase();
  if ((groupType === 'choose_two_letters' || groupType === 'CHOOSE_TWO_LETTERS') && (!groupOptions || groupOptions.length === 0)) {
    groupOptions = ['A', 'B', 'C', 'D', 'E'];
    console.log('[cleanQuestionGroup] Auto-generated options for choose_two_letters:', groupOptions);
  }
  
  const cleanedGroup = {
    type: String(group.type || '').trim(),
    name: String(group.name || '').trim(),
    description: String(group.description || '').trim(),
    instructions,
    startQuestion: Number(group.startQuestion) || 1,
    endQuestion: Number(group.endQuestion) || group.questions.length,
    questions: group.questions.map(q => cleanQuestion(q, group))
  };
  
  // Add options if they exist
  if (groupOptions && groupOptions.length > 0) {
    cleanedGroup.options = groupOptions;
  }
  
  return cleanedGroup;
}

function cleanQuestion(question, group) {
  const questionNumber = Number(question.questionNumber || question.id) || 1;
  let questionText = String(question.questionText || question.content || '').trim();
  const answer = String(question.answer || '').trim();
  
  const cleaned = {
    questionNumber,
    questionText,
    answer,
    points: Number(question.points) || 1,
    difficulty: question.difficulty || 'medium',
    keywords: Array.isArray(question.keywords) ? question.keywords.map(String) : [],
    relatedParagraph: question.relatedParagraph ? Number(question.relatedParagraph) : null
  };

  // Handle options conversion from object format to string array
  if (Array.isArray(question.options)) {
    cleaned.options = question.options.map((option) => {
      if (typeof option === 'object' && option !== null && option.value) {
        return String(option.value);
      }
      return String(option);
    });
  }

  return cleaned;
}

function cleanJsonData(data) {
  let passageData, questionGroupsData;
  
  if (data.metadata && data.content) {
    passageData = data.content.readingPassage;
    questionGroupsData = data.content.questionGroups;
  } else {
    passageData = data.passage || {};
    questionGroupsData = data.questionGroups || [];
  }

  const cleaned = {
    passage: {
      title: String(passageData?.title || '').trim(),
      content: String(passageData?.content || '').trim(),
      level: passageData?.level || 'intermediate',
      timeLimit: Number(passageData?.timeLimit) || 60,
      wordCount: Number(passageData?.wordCount) || 0,
      source: String(passageData?.source || '').trim(),
      tags: Array.isArray(passageData?.tags) ? passageData.tags.map(String) : []
    },
    questionGroups: Array.isArray(questionGroupsData) ? questionGroupsData.map(cleanQuestionGroup) : []
  };

  return cleaned;
}

// Test data without options
const testData = {
  "metadata": {
    "title": "Test Choose Two Letters",
    "id": "test-choose-two-001",
    "link": "test",
    "description": "Test data for choose_two_letters question type"
  },
  "content": {
    "readingPassage": {
      "title": "Test Passage for Choose Two Letters",
      "content": "This is a test passage. Climate change is one of the most pressing issues of our time."
    },
    "questionGroups": [
      {
        "type": "choose_two_letters",
        "name": "Choose Two Letters Test",
        "range": "Questions 1-2",
        "instructions": "Choose TWO letters, A-E. Which TWO of the following are mentioned as causes of climate change?",
        "questions": [
          {
            "id": 1,
            "content": "Which TWO of the following are mentioned as causes of climate change?",
            "answer": "A, C"
          },
          {
            "id": 2,
            "content": "Which TWO effects of climate change are mentioned in the passage?",
            "answer": "B, D"
          }
        ]
      }
    ]
  }
};

console.log('Testing options logic for choose_two_letters...');
console.log('Original data:', JSON.stringify(testData, null, 2));

try {
  const cleanedData = cleanJsonData(testData);
  console.log('\nCleaned data:');
  console.log('Question groups:', JSON.stringify(cleanedData.questionGroups, null, 2));
  
  const chooseGroup = cleanedData.questionGroups.find(g => g.type === 'choose_two_letters');
  if (chooseGroup) {
    console.log('\nChoose two letters group found:');
    console.log('Type:', chooseGroup.type);
    console.log('Options:', chooseGroup.options);
    console.log('Questions count:', chooseGroup.questions.length);
    
    chooseGroup.questions.forEach((q, index) => {
      console.log(`Question ${index + 1}:`);
      console.log('  Text:', q.questionText);
      console.log('  Answer:', q.answer);
      console.log('  Options:', q.options);
    });
  } else {
    console.log('\nNo choose_two_letters group found!');
  }
} catch (error) {
  console.error('Error testing options logic:', error);
}