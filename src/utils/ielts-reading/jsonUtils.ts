import { ImportData, ImportQuestionGroup, ImportQuestion } from '@/types/ielts-reading/import.types';
import { validateQuestionType, validateQuestionStructure, getQuestionTypeRequirements } from './dataTransformer';

// Format JSON for download with different formatting options
export const formatJsonForDownload = (data: ImportData, formatType: 'template' | 'compact' | 'readable'): string => {
  switch (formatType) {
    case 'compact':
      return JSON.stringify(data);
    case 'readable':
      return JSON.stringify(data, null, 2);
    case 'template':
    default:
      return JSON.stringify(data, null, 2);
  }
};

// Validate complete JSON structure
export const validateJsonStructure = (data: any): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      errors.push('Invalid JSON structure: Root must be an object');
      return { isValid: false, errors, warnings };
    }

    // Validate passage section
    const passageValidation = validatePassageSection(data.passage);
    errors.push(...passageValidation.errors);
    warnings.push(...passageValidation.warnings);

    // Validate question groups
    const questionGroupsValidation = validateQuestionGroups(data.questionGroups);
    errors.push(...questionGroupsValidation.errors);
    warnings.push(...questionGroupsValidation.warnings);

    // Validate metadata (optional)
    if (data.metadata) {
      const metadataValidation = validateMetadata(data.metadata);
      warnings.push(...metadataValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    errors.push(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, errors, warnings };
  }
};

// Validate passage section
const validatePassageSection = (passage: any): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!passage) {
    errors.push('Passage section is required');
    return { errors, warnings };
  }

  // Required fields
  if (!passage.title?.trim()) {
    errors.push('Passage title is required');
  }

  if (!passage.content?.trim()) {
    errors.push('Passage content is required');
  }

  if (!passage.level) {
    errors.push('Passage level is required');
  } else if (!['beginner', 'intermediate', 'advanced'].includes(passage.level)) {
    errors.push('Passage level must be: beginner, intermediate, or advanced');
  }

  // Optional fields validation
  if (passage.timeLimit && (typeof passage.timeLimit !== 'number' || passage.timeLimit < 1)) {
    warnings.push('Time limit should be a positive number (minutes)');
  }

  if (passage.wordCount && (typeof passage.wordCount !== 'number' || passage.wordCount < 1)) {
    warnings.push('Word count should be a positive number');
  }

  if (passage.tags && !Array.isArray(passage.tags)) {
    warnings.push('Tags should be an array of strings');
  }

  return { errors, warnings };
};

// Validate question groups
const validateQuestionGroups = (questionGroups: any): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(questionGroups)) {
    errors.push('Question groups must be an array');
    return { errors, warnings };
  }

  if (questionGroups.length === 0) {
    errors.push('At least one question group is required');
    return { errors, warnings };
  }

  questionGroups.forEach((group, groupIndex) => {
    const groupValidation = validateQuestionGroup(group, groupIndex);
    errors.push(...groupValidation.errors);
    warnings.push(...groupValidation.warnings);
  });

  return { errors, warnings };
};

// Validate individual question group
const validateQuestionGroup = (group: any, groupIndex: number): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = `Question Group ${groupIndex + 1}:`;

  // Required fields
  if (!group.type) {
    errors.push(`${prefix} Type is required`);
  } else if (!validateQuestionType(group.type)) {
    errors.push(`${prefix} Invalid question type: ${group.type}`);
  }

  if (!group.name?.trim()) {
    errors.push(`${prefix} Name is required`);
  }

  if (!group.instructions?.trim()) {
    errors.push(`${prefix} Instructions are required`);
  }

  // Validate questions
  if (!Array.isArray(group.questions)) {
    errors.push(`${prefix} Questions must be an array`);
  } else if (group.questions.length === 0) {
    errors.push(`${prefix} At least one question is required`);
  } else {
    group.questions.forEach((question: any, questionIndex: number) => {
      const questionValidation = validateQuestion(question, group.type, groupIndex, questionIndex);
      errors.push(...questionValidation.errors);
      warnings.push(...questionValidation.warnings);
    });
  }

  // Validate question numbering
  if (group.questions && Array.isArray(group.questions)) {
    const questionNumbers = group.questions.map((q: any) => q.questionNumber).filter(Boolean);
    const uniqueNumbers = new Set(questionNumbers);
    
    if (questionNumbers.length !== uniqueNumbers.size) {
      errors.push(`${prefix} Duplicate question numbers found`);
    }

    // Check sequential numbering
    const sortedNumbers = [...questionNumbers].sort((a, b) => a - b);
    for (let i = 1; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] !== sortedNumbers[i - 1] + 1) {
        warnings.push(`${prefix} Question numbers are not sequential`);
        break;
      }
    }
  }

  return { errors, warnings };
};

// Validate individual question
const validateQuestion = (
  question: any, 
  groupType: string, 
  groupIndex: number, 
  questionIndex: number
): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = `Question Group ${groupIndex + 1}, Question ${questionIndex + 1}:`;

  // Use existing validation from dataTransformer
  const structureErrors = validateQuestionStructure(question, groupType);
  errors.push(...structureErrors.map(error => `${prefix} ${error}`));

  // Additional validations
  if (question.points && (typeof question.points !== 'number' || question.points < 0)) {
    warnings.push(`${prefix} Points should be a non-negative number`);
  }

  if (question.difficulty && !['easy', 'medium', 'hard'].includes(question.difficulty)) {
    warnings.push(`${prefix} Difficulty should be: easy, medium, or hard`);
  }

  if (question.keywords && !Array.isArray(question.keywords)) {
    warnings.push(`${prefix} Keywords should be an array of strings`);
  }

  if (question.relatedParagraph && typeof question.relatedParagraph !== 'number') {
    warnings.push(`${prefix} Related paragraph should be a number`);
  }

  return { errors, warnings };
};

// Validate metadata section
const validateMetadata = (metadata: any): { warnings: string[] } => {
  const warnings: string[] = [];

  if (metadata.version && typeof metadata.version !== 'string') {
    warnings.push('Metadata version should be a string');
  }

  if (metadata.createdAt && !isValidDate(metadata.createdAt)) {
    warnings.push('Metadata createdAt should be a valid ISO date string');
  }

  if (metadata.totalQuestionTypes && typeof metadata.totalQuestionTypes !== 'number') {
    warnings.push('Metadata totalQuestionTypes should be a number');
  }

  if (metadata.totalQuestions && typeof metadata.totalQuestions !== 'number') {
    warnings.push('Metadata totalQuestions should be a number');
  }

  return { warnings };
};

// Helper function to validate date
const isValidDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T');
  } catch {
    return false;
  }
};

// Generate validation summary
export const generateValidationSummary = (validation: { isValid: boolean; errors: string[]; warnings: string[] }) => {
  const summary = {
    status: validation.isValid ? 'valid' : 'invalid',
    errorCount: validation.errors.length,
    warningCount: validation.warnings.length,
    canImport: validation.isValid,
    message: ''
  };

  if (validation.isValid) {
    if (validation.warnings.length > 0) {
      summary.message = `Valid with ${validation.warnings.length} warning(s). Ready to import.`;
    } else {
      summary.message = 'Valid JSON structure. Ready to import.';
    }
  } else {
    summary.message = `Invalid JSON structure. ${validation.errors.length} error(s) found.`;
  }

  return summary;
};

// Extract preview data from JSON
export const extractPreviewData = (data: ImportData) => {
  const questionGroups = data.questionGroups || [];
  const totalQuestions = questionGroups.reduce((total, group) => total + (group.questions?.length || 0), 0);
  const questionTypes = [...new Set(questionGroups.map(group => group.type))];

  // Split passage content into paragraphs
  const passageContent = data.passage?.content ? 
    data.passage.content.split('\n\n').filter(paragraph => paragraph.trim().length > 0) : [];

  return {
    passage: {
      title: data.passage?.title || 'Untitled',
      level: data.passage?.level || 'intermediate',
      wordCount: data.passage?.wordCount || 0,
      timeLimit: data.passage?.timeLimit || 60
    },
    passageContent,
    statistics: {
      totalQuestions,
      questionGroupsCount: questionGroups.length,
      questionTypes: questionTypes.length,
      uniqueTypes: questionTypes
    },
    questionGroups: questionGroups.map(group => ({
      type: group.type,
      name: group.name,
      questionsCount: group.questions?.length || 0,
      questionRange: `${group.startQuestion || 1}-${group.endQuestion || group.questions?.length || 1}`,
      questions: group.questions || [],
      contentSegments: (group as any).contentSegments // Include contentSegments for completion types
    }))
  };
};

// Clean and normalize JSON data
export const cleanJsonData = (data: any): ImportData => {
  console.log('[cleanJsonData] Input data structure:', {
    hasPassage: !!data.passage,
    hasContent: !!data.content,
    hasContentReadingPassage: !!data.content?.readingPassage,
    hasQuestionGroups: !!data.questionGroups,
    hasContentQuestionGroups: !!data.content?.questionGroups
  });

  // Detect and handle different JSON formats
  let passageData, questionGroupsData;
  
  // Format 1: Standard format with direct passage and questionGroups
  if (data.passage && data.questionGroups) {
    console.log('[cleanJsonData] Using standard format');
    passageData = data.passage;
    questionGroupsData = data.questionGroups;
  }
  // Format 2: Demo format with content.readingPassage and content.questionGroups
  else if (data.content?.readingPassage && data.content?.questionGroups) {
    console.log('[cleanJsonData] Using demo format, converting to standard format');
    // Convert demo format to standard format
    const readingPassage = data.content.readingPassage;
    passageData = {
      title: readingPassage.title,
      content: Array.isArray(readingPassage.paragraphs) 
        ? readingPassage.paragraphs.map((p: any) => p.content || p).join('\n\n')
        : readingPassage.content || '',
      level: 'intermediate', // Default level for demo data
      timeLimit: 60,
      wordCount: 0,
      source: data.metadata?.link || '',
      tags: []
    };
    questionGroupsData = data.content.questionGroups;
  }
  // Format 3: Legacy format or other variations
  else {
    console.warn('[cleanJsonData] Unknown format, using fallback');
    passageData = data.passage || {};
    questionGroupsData = data.questionGroups || [];
  }

  const cleaned: ImportData = {
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

  console.log('[cleanJsonData] Cleaned data:', {
    passageTitle: cleaned.passage.title,
    passageContentLength: cleaned.passage.content.length,
    questionGroupsCount: cleaned.questionGroups.length
  });

  if (data.metadata) {
    cleaned.metadata = {
      version: String(data.metadata.version || '1.0'),
      description: String(data.metadata.description || ''),
      createdAt: data.metadata.createdAt || new Date().toISOString(),
      totalQuestionTypes: Number(data.metadata.totalQuestionTypes) || cleaned.questionGroups.length,
      totalQuestions: Number(data.metadata.totalQuestions) || 
        cleaned.questionGroups.reduce((total, group) => total + group.questions.length, 0)
    };
  }

  return cleaned;
};

// Clean question group data
const cleanQuestionGroup = (group: any): ImportQuestionGroup => {
  // For note_table_flowchart_diagram_completion, we need to process contentSegments
  let questions = Array.isArray(group.questions) ? group.questions.map((q: any) => cleanQuestion(q, group)) : [];
  
  // Handle different instruction formats
  const instructions = String(group.instructions || group.content || '').trim();
  
  console.log('[cleanQuestionGroup] Processing group:', {
    type: group.type,
    name: group.name,
    hasInstructions: !!group.instructions,
    hasContent: !!group.content,
    hasContentSegments: !!group.contentSegments,
    questionsCount: questions.length,
    finalInstructions: instructions.substring(0, 100) + '...'
  });
  
  return {
    type: String(group.type || '').trim(),
    name: String(group.name || '').trim(),
    description: String(group.description || '').trim(),
    instructions,
    startQuestion: Number(group.startQuestion) || 1,
    endQuestion: Number(group.endQuestion) || questions.length,
    questions,
    contentSegments: group.contentSegments // Preserve contentSegments for completion types
  };
};

// Helper function to build question text from contentSegments
const buildQuestionTextFromSegments = (contentSegments: any[], questionId: number): string => {
  if (!Array.isArray(contentSegments)) return '';
  
  // Find the target blank and extract context around it
  let targetBlankIndex = -1;
  let blankCounter = 0;
  
  // First pass: find the target blank position
  for (let i = 0; i < contentSegments.length; i++) {
    const segment = contentSegments[i];
    if (segment.type === 'blank') {
      blankCounter++;
      if (segment.questionId === questionId) {
        targetBlankIndex = i;
        break;
      }
    }
  }
  
  if (targetBlankIndex === -1) return '';
  
  // Extract context: previous text + blank + next text
  let questionText = '';
  let contextStart = Math.max(0, targetBlankIndex - 1);
  let contextEnd = Math.min(contentSegments.length - 1, targetBlankIndex + 1);
  
  // Extend context to include more meaningful text
  while (contextStart > 0 && contentSegments[contextStart].type === 'text' && 
         contentSegments[contextStart].value && contentSegments[contextStart].value.length < 50) {
    contextStart--;
  }
  
  while (contextEnd < contentSegments.length - 1 && contentSegments[contextEnd].type === 'text' && 
         contentSegments[contextEnd].value && contentSegments[contextEnd].value.length < 50) {
    contextEnd++;
  }
  
  // Build the question text with context
  let currentBlankNumber = 0;
  for (let i = 0; i <= contextEnd; i++) {
    const segment = contentSegments[i];
    if (segment.type === 'blank') {
      currentBlankNumber++;
    }
    
    if (i >= contextStart) {
      if (segment.type === 'text') {
        questionText += segment.value || '';
      } else if (segment.type === 'blank') {
        if (segment.questionId === questionId) {
          questionText += `(${currentBlankNumber}) ______`;
        } else {
          questionText += `(${currentBlankNumber}) ______`;
        }
      }
    }
  }
  
  return questionText.trim();
};

// Clean question data
const cleanQuestion = (question: any, group?: any): ImportQuestion => {
  // Handle different question formats
  const questionNumber = Number(question.questionNumber || question.id) || 1;
  
  let questionText = String(question.questionText || question.content || '').trim();
  
  // For note_table_flowchart_diagram_completion type, build question text from contentSegments
  if (!questionText && group?.contentSegments && group.type === 'note_table_flowchart_diagram_completion') {
    questionText = buildQuestionTextFromSegments(group.contentSegments, question.id);
    
    // If still no text, use a more descriptive placeholder
    if (!questionText && question.answer) {
      questionText = `Complete the blank with the correct word (Answer: ${question.answer})`;
    }
  }
  
  // If no question text found, generate from answer for completion-type questions
  if (!questionText && question.answer) {
    questionText = `Fill in the blank (Answer: ${question.answer})`;
  }
  
  const answer = String(question.answer || '').trim();
  const guide = question.guide ? String(question.guide).trim() : undefined;
  
  console.log('[cleanQuestion] Processing question:', {
    originalId: question.id,
    originalQuestionNumber: question.questionNumber,
    hasContent: !!question.content,
    hasQuestionText: !!question.questionText,
    hasAnswer: !!question.answer,
    hasContentSegments: !!group?.contentSegments,
    finalQuestionNumber: questionNumber,
    finalQuestionText: questionText.substring(0, 100) + '...',
    generatedFromSegments: !question.questionText && !question.content && !!group?.contentSegments
  });

  const cleaned: ImportQuestion = {
    questionNumber,
    questionText,
    answer,
    points: Number(question.points) || 1,
    difficulty: question.difficulty || 'medium',
    keywords: Array.isArray(question.keywords) ? question.keywords.map(String) : [],
    relatedParagraph: question.relatedParagraph ? Number(question.relatedParagraph) : null
  };

  if (Array.isArray(question.options)) {
    cleaned.options = question.options.map(String);
  }

  if (guide) {
    cleaned.guide = guide;
  }

  return cleaned;
};