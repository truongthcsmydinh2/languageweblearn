import { Passage } from './passage.types';
import { QuestionGroup } from './question.types';

export interface IeltsTest {
  id?: number;
  title: string;
  description: string;
  is_active: boolean;
  passages: TestPassage[];
  all_answers?: TestAnswer[];
  created_at?: string;
  updated_at?: string;
}

export interface TestPassage {
  title: string;
  content: string;
  groups: TestQuestionGroup[];
}

export interface TestQuestionGroup {
  questionType: string;
  content: string;
  questions: TestQuestion[];
}

export interface TestQuestion {
  questionText: string;
  options?: string[];
  explanation?: string;
  note?: string;
  orderIndex: number;
}

export interface TestAnswer {
  question_number: string;
  answer: string;
  explanation?: string;
  order_index: number;
}

export interface TestFormData {
  title: string;
  description: string;
  is_active: boolean;
  passages: TestPassage[];
}

export interface TestActions {
  createTest: (data: TestFormData) => Promise<void>;
  updateTest: (id: number, data: TestFormData) => Promise<void>;
  deleteTest: (id: number) => Promise<void>;
  generateQuestions: (passageIndex: number) => Promise<void>;
  generateAnswers: (rawAnswers: string) => Promise<void>;
}

export interface TestBuilderProps {
  test: IeltsTest;
  onUpdateTest: (test: IeltsTest) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export interface TestPreviewProps {
  test: IeltsTest;
  onEdit: () => void;
  onClose: () => void;
}