// Export all types
export * from './passage.types';
export * from './question.types';
export * from './test.types';
export * from './import.types';

// Common types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface UIState extends LoadingState {
  showModal: boolean;
  modalType: 'create' | 'edit' | 'delete' | 'preview' | null;
}

// Context types
export interface IeltsReadingContextType {
  // Passages
  passages: Passage[];
  selectedPassage: Passage | null;
  
  // Questions
  questions: Question[];
  selectedQuestions: Question[];
  
  // Test Builder
  currentTest: IeltsTest | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Actions
  actions: {
    passages: PassageActions;
    questions: QuestionActions;
    tests: TestActions;
    import: ImportActions;
  };
}

// Re-export specific types for convenience
export type { Passage, PassageFormData } from './passage.types';
export type { Question, QuestionType, QuestionGroup } from './question.types';
export type { IeltsTest, TestPassage } from './test.types';
export type { ImportData, ImportPreviewData } from './import.types';