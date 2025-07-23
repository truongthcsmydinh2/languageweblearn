export interface ImportData {
  passage: {
    title: string;
    content: string;
    level: string;
    timeLimit?: number;
    wordCount?: number;
    source?: string;
    tags?: string[];
  };
  questionGroups: ImportQuestionGroup[];
  metadata?: {
    version?: string;
    description?: string;
    createdAt?: string;
    totalQuestionTypes?: number;
    totalQuestions?: number;
  };
}

export interface ImportQuestionGroup {
  type: string;
  name: string;
  description?: string;
  instructions: string;
  startQuestion?: number;
  endQuestion?: number;
  questions: ImportQuestion[];
  options?: string[];
  contentSegments?: {
    type: 'text' | 'blank';
    value?: string;
    questionId?: number;
  }[];
}

export interface ImportQuestion {
  questionNumber: number;
  questionText: string;
  answer: string;
  options?: string[];
  points?: number;
  difficulty?: string;
  keywords?: string[];
  relatedParagraph?: number | null;
  guide?: string;
}

export interface ImportPreviewData {
  passage: {
    title: string;
    level: string;
    wordCount: number;
    timeLimit: number;
  };
  passageContent?: string[];
  statistics: {
    totalQuestions: number;
    questionGroupsCount: number;
    questionTypes: number;
    uniqueTypes: string[];
  };
  questionGroups: {
    type: string;
    name: string;
    questionsCount: number;
    questionRange: string;
    questions?: {
      questionText?: string;
      content?: string;
      options?: string[];
      correctAnswer?: string;
      answer?: string;
      explanation?: string;
    }[];
    contentSegments?: {
      type: 'text' | 'blank';
      value?: string;
      questionId?: number;
    }[];
  }[];
}

export interface ImportActions {
  importFromFile: (file: File) => Promise<void>;
  importFromUrl: (url: string) => Promise<void>;
  previewImport: (data: ImportData) => ImportPreviewData;
  processImport: (previewData: ImportPreviewData) => Promise<void>;
}

export interface ImportFormProps {
  onImport: (data: ImportPreviewData) => void;
  loading?: boolean;
}

export interface ImportPreviewProps {
  data: ImportPreviewData;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}