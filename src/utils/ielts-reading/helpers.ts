import { ImportData, ImportPreviewData, QuestionType } from '@/types/ielts-reading';

export const formatTimeLimit = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getQuestionTypeLabel = (type: QuestionType): string => {
  const typeMap: Record<QuestionType, string> = {
    'multiple_choice': 'Trắc nghiệm (4 đáp án)',
    'multiple_choice_5': 'Trắc nghiệm (5 đáp án)',
    'multiple_choice_group': 'Trắc nghiệm nhóm',
    'true_false_not_given': 'True/False/Not Given',
    'yes_no_not_given': 'Yes/No/Not Given',
    'matching_headings': 'Matching Headings',
    'matching_information': 'Matching Information',
    'matching_features': 'Matching Features',
    'matching_sentence_endings': 'Matching Sentence Endings',
    'sentence_completion': 'Sentence Completion',
    'summary_completion': 'Summary Completion',
    'note_completion': 'Note Completion',
    'table_completion': 'Table Completion',
    'flow_chart_completion': 'Flow Chart Completion',
    'diagram_labelling': 'Diagram Labelling',
    'short_answer_questions': 'Short Answer Questions',
    'matching_phrases': 'Matching Phrases',
    'choose_two_letters': 'Choose Two Letters'
  };
  return typeMap[type] || type;
};

export const getLevelBadgeClass = (level: string): string => {
  switch (level) {
    case 'beginner':
      return 'badge bg-success';
    case 'intermediate':
      return 'badge bg-warning';
    case 'advanced':
      return 'badge bg-danger';
    default:
      return 'badge bg-secondary';
  }
};

export const getLevelClass = (level: string): string => {
  switch (level) {
    case 'beginner':
      return 'text-green-600 bg-green-100';
    case 'intermediate':
      return 'text-yellow-600 bg-yellow-100';
    case 'advanced':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const generateQuestionNumber = (groupIndex: number, questionIndex: number): string => {
  // Simple numbering: 1, 2, 3, ...
  return `${groupIndex * 10 + questionIndex + 1}`;
};

export const parseAnswersFromText = (text: string): Array<{ question_number: string; answer: string }> => {
  const lines = text.split('\n').filter(line => line.trim());
  const answers: Array<{ question_number: string; answer: string }> = [];

  lines.forEach(line => {
    // Match patterns like "1. A", "2: B", "3 - C", etc.
    const match = line.match(/^(\d+)[.:\-\s]+([A-Za-z0-9]+)/i);
    if (match) {
      answers.push({
        question_number: match[1],
        answer: match[2].toUpperCase()
      });
    }
  });

  return answers;
};

export const transformImportData = (data: ImportData): ImportPreviewData => {
  const { metadata, content } = data;
  
  // Transform reading passage
  const passageContent = content.readingPassage.paragraphs.join('\n\n');
  
  // Transform question groups
  const questionGroups = content.questionGroups.map(group => ({
    type: group.type,
    questions: group.questions.map(q => ({
      text: q.content,
      answer: q.answer,
      options: q.options ? Object.values(q.options).filter(Boolean) : undefined
    }))
  }));
  
  const totalQuestions = content.questionGroups.reduce(
    (sum, group) => sum + group.questions.length, 
    0
  );
  
  return {
    title: metadata.title,
    content: passageContent,
    questionGroups,
    totalQuestions
  };
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const downloadJSON = (data: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

export const estimateReadingTime = (content: string): number => {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};