import { QuestionType } from '@/types/ielts-reading';

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Trắc nghiệm (4 đáp án)' },
  { value: 'multiple_choice_5', label: 'Trắc nghiệm (5 đáp án)' },
  { value: 'multiple_choice_group', label: 'Trắc nghiệm nhóm' },
  { value: 'true_false_not_given', label: 'True/False/Not Given' },
  { value: 'yes_no_not_given', label: 'Yes/No/Not Given' },
  { value: 'matching_headings', label: 'Matching Headings' },
  { value: 'matching_information', label: 'Matching Information' },
  { value: 'matching_features', label: 'Matching Features' },
  { value: 'matching_sentence_endings', label: 'Matching Sentence Endings' },
  { value: 'sentence_completion', label: 'Sentence Completion' },
  { value: 'summary_completion', label: 'Summary Completion' },
  { value: 'note_completion', label: 'Note Completion' },
  { value: 'table_completion', label: 'Table Completion' },
  { value: 'flow_chart_completion', label: 'Flow Chart Completion' },
  { value: 'diagram_labelling', label: 'Diagram Labelling' },
  { value: 'short_answer_questions', label: 'Short Answer Questions' },
  { value: 'matching_phrases', label: 'Matching Phrases' },
  { value: 'choose_two_letters', label: 'Choose Two Letters' }
];

export const PASSAGE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
] as const;

export const DEFAULT_TIME_LIMIT = 20; // minutes

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ACCEPTED_FILE_TYPES = [
  'application/json',
  'text/plain'
];

export const API_ENDPOINTS = {
  PASSAGES: '/api/admin/ielts-reading/passages',
  QUESTIONS: '/api/admin/ielts-reading/questions',
  COMPLETE_TEST: '/api/admin/ielts-reading/complete-test',
  IMPORT: '/api/admin/ielts-reading/import',
  EXPORT: '/api/admin/ielts-reading/export',
  AI_GENERATE: '/api/admin/ielts-reading/ai-generate'
} as const;

export const TOAST_MESSAGES = {
  SUCCESS: {
    PASSAGE_CREATED: 'Tạo bài đọc thành công!',
    PASSAGE_UPDATED: 'Cập nhật bài đọc thành công!',
    PASSAGE_DELETED: 'Xóa bài đọc thành công!',
    QUESTION_CREATED: 'Tạo câu hỏi thành công!',
    QUESTION_UPDATED: 'Cập nhật câu hỏi thành công!',
    QUESTION_DELETED: 'Xóa câu hỏi thành công!',
    TEST_CREATED: 'Tạo đề thi thành công!',
    IMPORT_SUCCESS: 'Import dữ liệu thành công!',
    EXPORT_SUCCESS: 'Export dữ liệu thành công!'
  },
  ERROR: {
    GENERIC: 'Có lỗi xảy ra. Vui lòng thử lại!',
    NETWORK: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối!',
    VALIDATION: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!',
    FILE_TOO_LARGE: 'File quá lớn. Vui lòng chọn file nhỏ hơn 5MB!',
    INVALID_FILE_TYPE: 'Loại file không được hỗ trợ!',
    IMPORT_FAILED: 'Import thất bại. Vui lòng kiểm tra định dạng file!'
  }
} as const;

export const LOADING_MESSAGES = {
  FETCHING_PASSAGES: 'Đang tải danh sách bài đọc...',
  FETCHING_QUESTIONS: 'Đang tải câu hỏi...',
  SAVING: 'Đang lưu...',
  DELETING: 'Đang xóa...',
  IMPORTING: 'Đang import...',
  EXPORTING: 'Đang export...',
  GENERATING: 'Đang tạo câu hỏi...'
} as const;