import { QuestionType } from '@/types/ielts-reading';

export const validatePassageForm = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Tiêu đề không được để trống');
  }

  if (!data.content?.trim()) {
    errors.push('Nội dung không được để trống');
  }

  if (!data.category?.trim()) {
    errors.push('Danh mục không được để trống');
  }

  if (!data.level || !['beginner', 'intermediate', 'advanced'].includes(data.level)) {
    errors.push('Cấp độ không hợp lệ');
  }

  if (!data.time_limit || data.time_limit < 1 || data.time_limit > 120) {
    errors.push('Thời gian làm bài phải từ 1-120 phút');
  }

  return errors;
};

export const validateQuestionForm = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.question_text?.trim()) {
    errors.push('Câu hỏi không được để trống');
  }

  if (!data.question_type) {
    errors.push('Loại câu hỏi không được để trống');
  }

  if (!data.correct_answer?.trim()) {
    errors.push('Đáp án đúng không được để trống');
  }

  // Validate options for multiple choice questions
  if (data.question_type?.includes('multiple_choice') && data.options) {
    const validOptions = data.options.filter((opt: string) => opt?.trim());
    const requiredOptions = data.question_type === 'multiple_choice_5' ? 5 : 4;
    
    if (validOptions.length < requiredOptions) {
      errors.push(`Cần có ít nhất ${requiredOptions} lựa chọn`);
    }
  }

  if (data.order_index && (data.order_index < 1 || data.order_index > 1000)) {
    errors.push('Thứ tự câu hỏi phải từ 1-1000');
  }

  return errors;
};

export const validateTestForm = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Tiêu đề đề thi không được để trống');
  }

  if (!data.passages || !Array.isArray(data.passages) || data.passages.length === 0) {
    errors.push('Đề thi phải có ít nhất một bài đọc');
  }

  data.passages?.forEach((passage: any, index: number) => {
    if (!passage.title?.trim()) {
      errors.push(`Bài đọc ${index + 1}: Tiêu đề không được để trống`);
    }
    
    if (!passage.content?.trim()) {
      errors.push(`Bài đọc ${index + 1}: Nội dung không được để trống`);
    }

    if (!passage.groups || passage.groups.length === 0) {
      errors.push(`Bài đọc ${index + 1}: Phải có ít nhất một nhóm câu hỏi`);
    }
  });

  return errors;
};

export const validateImportData = (data: any): string[] => {
  const errors: string[] = [];

  if (!data) {
    errors.push('Dữ liệu import không hợp lệ');
    return errors;
  }

  // Check for new format
  if (data.metadata && data.content) {
    if (!data.metadata.title) {
      errors.push('Metadata thiếu tiêu đề');
    }

    if (!data.content.readingPassage) {
      errors.push('Thiếu nội dung bài đọc');
    }

    if (!data.content.questionGroups || !Array.isArray(data.content.questionGroups)) {
      errors.push('Thiếu nhóm câu hỏi');
    }
  }
  // Check for old format
  else if (data.title && data.content && data.questions) {
    if (!data.title.trim()) {
      errors.push('Tiêu đề không được để trống');
    }

    if (!data.content.trim()) {
      errors.push('Nội dung không được để trống');
    }

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      errors.push('Phải có ít nhất một câu hỏi');
    }
  }
  else {
    errors.push('Định dạng dữ liệu không được hỗ trợ');
  }

  return errors;
};

export const validateFileUpload = (file: File): string[] => {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['application/json', 'text/plain'];

  if (file.size > maxSize) {
    errors.push('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push('Loại file không được hỗ trợ. Chỉ chấp nhận file JSON hoặc TXT');
  }

  return errors;
};

export const autoClassifyQuestion = (questionText: string): QuestionType => {
  const text = questionText.toLowerCase();

  // Check for fill-in-the-blank questions
  if (text.includes('___') || text.includes('{blank}') || text.includes('...') || 
      text.includes('fill in') || text.includes('điền') || text.includes('complete') ||
      text.includes('fill the blank') || text.includes('complete the sentence') ||
      text.includes('sentence completion') || text.includes('summary completion') ||
      text.includes('note completion') || text.includes('table completion') ||
      text.includes('flow-chart completion') || text.includes('diagram labelling') ||
      text.includes('short-answer questions')) {
    return 'sentence_completion';
  }

  // Check for true/false questions
  if (text.includes('true') || text.includes('false') || 
      text.includes('đúng') || text.includes('sai') ||
      text.includes('yes') || text.includes('no') ||
      text.includes('agree') || text.includes('disagree') ||
      text.includes('correct') || text.includes('incorrect') ||
      text.includes('statement') || text.includes('claim') ||
      text.includes('true/false/not given') || text.includes('yes/no/not given')) {
    return 'true_false_not_given';
  }

  // Check for matching questions
  if (text.includes('match') || text.includes('nối') || 
      text.includes('correspond') || text.includes('tương ứng') ||
      text.includes('connect') || text.includes('liên kết') ||
      text.includes('pair') || text.includes('link') ||
      text.includes('relate') || text.includes('associate') ||
      text.includes('matching headings') || text.includes('matching information') ||
      text.includes('matching features') || text.includes('matching sentence endings')) {
    return 'matching_headings';
  }

  // Default to multiple choice
  return 'multiple_choice';
};

export const generateDefaultOptions = (questionType: QuestionType): string[] => {
  switch (questionType) {
    case 'true_false_not_given':
      return ['True', 'False', 'Not Given'];
    case 'yes_no_not_given':
      return ['Yes', 'No', 'Not Given'];
    case 'multiple_choice_5':
    case 'multiple_choice_group':
      return ['A', 'B', 'C', 'D', 'E'];
    case 'multiple_choice':
      return ['A', 'B', 'C', 'D'];
    default:
      return [];
  }
};