import { Passage, QuestionGroup, Question } from '@/types/ielts-reading';
import { ImportData, ImportQuestionGroup, ImportQuestion } from '@/types/ielts-reading/import.types';

// Transform JSON import data to Passage format
export const transformJsonToPassage = (importData: ImportData): Omit<Passage, 'id' | 'createdAt' | 'updatedAt'> => {
  const passage: Omit<Passage, 'id' | 'createdAt' | 'updatedAt'> = {
    title: importData.passage.title,
    content: importData.passage.content,
    level: importData.passage.level as 'beginner' | 'intermediate' | 'advanced',
    timeLimit: importData.passage.timeLimit || 60,
    wordCount: importData.passage.wordCount || 0,
    source: importData.passage.source || '',
    tags: importData.passage.tags || [],
    questionGroups: importData.questionGroups.map(transformImportQuestionGroup)
  };

  return passage;
};

// Transform ImportQuestionGroup to QuestionGroup
const transformImportQuestionGroup = (importGroup: ImportQuestionGroup): Omit<QuestionGroup, 'id' | 'passageId' | 'createdAt' | 'updatedAt'> => {
  return {
    type: importGroup.type,
    name: importGroup.name,
    description: importGroup.description || '',
    instructions: importGroup.instructions,
    startQuestion: importGroup.startQuestion || 1,
    endQuestion: importGroup.endQuestion || importGroup.questions.length,
    questions: importGroup.questions.map(transformImportQuestion)
  };
};

// Transform ImportQuestion to Question
const transformImportQuestion = (importQuestion: ImportQuestion): Omit<Question, 'id' | 'questionGroupId' | 'createdAt' | 'updatedAt'> => {
  return {
    questionNumber: importQuestion.questionNumber,
    questionText: importQuestion.questionText,
    options: importQuestion.options || [],
    correctAnswer: importQuestion.answer,
    explanation: importQuestion.guide || '',
    points: importQuestion.points || 1,
    difficulty: importQuestion.difficulty || 'medium',
    keywords: importQuestion.keywords || [],
    relatedParagraph: importQuestion.relatedParagraph || null
  };
};

// Transform Passage to JSON export format
export const transformPassageToJson = async (
  passage: Passage, 
  options: {
    includeGuides: boolean;
    includeMetadata: boolean;
    formatType: 'template' | 'compact' | 'readable';
  }
): Promise<ImportData> => {
  const exportData: ImportData = {
    passage: {
      title: passage.title,
      content: passage.content,
      level: passage.level,
      timeLimit: passage.timeLimit,
      wordCount: passage.wordCount,
      source: passage.source || '',
      tags: passage.tags || []
    },
    questionGroups: passage.questionGroups?.map(group => transformQuestionGroupToImport(group, options.includeGuides)) || [],
    metadata: options.includeMetadata ? {
      version: '1.0',
      description: `Exported IELTS Reading passage: ${passage.title}`,
      createdAt: new Date().toISOString(),
      totalQuestionTypes: passage.questionGroups?.length || 0,
      totalQuestions: passage.questionGroups?.reduce((total, group) => total + (group.questions?.length || 0), 0) || 0,
      exportOptions: options
    } : undefined
  };

  return exportData;
};

// Transform QuestionGroup to ImportQuestionGroup
const transformQuestionGroupToImport = (group: QuestionGroup, includeGuides: boolean): ImportQuestionGroup => {
  return {
    type: group.type,
    name: group.name,
    description: group.description || '',
    instructions: group.instructions,
    startQuestion: group.startQuestion || 1,
    endQuestion: group.endQuestion || group.questions?.length || 1,
    questions: group.questions?.map(q => transformQuestionToImport(q, includeGuides)) || []
  };
};

// Transform Question to ImportQuestion
const transformQuestionToImport = (question: Question, includeGuides: boolean): ImportQuestion => {
  const importQuestion: ImportQuestion = {
    questionNumber: question.questionNumber,
    questionText: question.questionText,
    answer: question.correctAnswer,
    points: question.points || 1,
    difficulty: question.difficulty || 'medium',
    keywords: question.keywords || [],
    relatedParagraph: question.relatedParagraph || null
  };

  // Add options if they exist
  if (question.options && question.options.length > 0) {
    importQuestion.options = question.options;
  }

  // Add guide if requested
  if (includeGuides && question.explanation) {
    importQuestion.guide = question.explanation;
  }

  return importQuestion;
};

// Validate question type compatibility
export const validateQuestionType = (type: string): boolean => {
  const validTypes = [
    'multiple_choice_single',
    'choose_two_letters', 
    'true_false_not_given',
    'yes_no_not_given',
    'matching_headings',
    'matching_phrases',
    'matching_features',
    'matching_sentence_endings',
    'sentence_completion',
    'summary_completion',
    'note_table_flowchart_diagram_completion',
    'short_answer'
  ];
  
  return validTypes.includes(type);
};

// Get question type requirements
export const getQuestionTypeRequirements = (type: string) => {
  const requirements: Record<string, {
    requiresOptions: boolean;
    optionsCount?: number;
    answerFormat: string;
    description: string;
  }> = {
    'multiple_choice_single': {
      requiresOptions: true,
      optionsCount: 4,
      answerFormat: 'Single letter (A, B, C, or D)',
      description: 'Multiple choice with single correct answer'
    },
    'choose_two_letters': {
      requiresOptions: false,
      answerFormat: 'Two letters separated by comma (e.g., A, C)',
      description: 'Choose two correct answers from options'
    },
    'true_false_not_given': {
      requiresOptions: false,
      answerFormat: 'TRUE, FALSE, or NOT GIVEN',
      description: 'Determine if statement is true, false, or not given'
    },
    'yes_no_not_given': {
      requiresOptions: false,
      answerFormat: 'YES, NO, or NOT GIVEN',
      description: 'Determine if statement agrees, disagrees, or not given'
    },
    'matching_headings': {
      requiresOptions: true,
      answerFormat: 'Roman numeral (i, ii, iii, etc.)',
      description: 'Match paragraphs with appropriate headings'
    },
    'matching_phrases': {
      requiresOptions: false,
      answerFormat: 'Letter corresponding to phrase',
      description: 'Match items with appropriate phrases'
    },
    'matching_features': {
      requiresOptions: true,
      answerFormat: 'Letter corresponding to feature',
      description: 'Match items with features or characteristics'
    },
    'matching_sentence_endings': {
      requiresOptions: true,
      answerFormat: 'Letter corresponding to sentence ending',
      description: 'Complete sentences by matching with appropriate endings'
    },
    'sentence_completion': {
      requiresOptions: false,
      answerFormat: 'Word(s) from passage (max 3 words)',
      description: 'Complete sentences with words from passage'
    },
    'summary_completion': {
      requiresOptions: false,
      answerFormat: 'Word(s) from passage or word bank',
      description: 'Complete summary with appropriate words'
    },
    'note_table_flowchart_diagram_completion': {
      requiresOptions: false,
      answerFormat: 'Word(s) from passage (max 2-3 words)',
      description: 'Complete notes, tables, flowcharts, or diagrams'
    },
    'short_answer': {
      requiresOptions: false,
      answerFormat: 'Short answer (max 3 words)',
      description: 'Provide short answers to questions'
    }
  };

  return requirements[type] || {
    requiresOptions: false,
    answerFormat: 'Text answer',
    description: 'Unknown question type'
  };
};

// Validate question structure based on type
export const validateQuestionStructure = (question: ImportQuestion, type: string): string[] => {
  const errors: string[] = [];
  const requirements = getQuestionTypeRequirements(type);

  // Check required fields
  if (!question.questionText?.trim()) {
    errors.push('Question text is required');
  }

  if (!question.answer?.trim()) {
    errors.push('Answer is required');
  }

  // Check options requirement
  if (requirements.requiresOptions) {
    if (!question.options || question.options.length === 0) {
      errors.push(`Options are required for ${type}`);
    } else if (requirements.optionsCount && question.options.length !== requirements.optionsCount) {
      errors.push(`Expected ${requirements.optionsCount} options, got ${question.options.length}`);
    }
  }

  // Validate question number
  if (question.questionNumber < 1) {
    errors.push('Question number must be positive');
  }

  return errors;
};

// Generate question template for specific type
export const generateQuestionTemplate = (type: string, questionNumber: number): ImportQuestion => {
  const requirements = getQuestionTypeRequirements(type);
  
  const template: ImportQuestion = {
    questionNumber,
    questionText: `[Question ${questionNumber} text here]`,
    answer: '[Correct answer here]',
    points: 1,
    difficulty: 'medium',
    keywords: [],
    relatedParagraph: null
  };

  if (requirements.requiresOptions) {
    const optionCount = requirements.optionsCount || 4;
    template.options = Array.from({ length: optionCount }, (_, i) => 
      `Option ${String.fromCharCode(65 + i)}`
    );
  }

  return template;
};