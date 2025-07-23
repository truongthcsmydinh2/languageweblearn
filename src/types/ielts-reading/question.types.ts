export type QuestionType = 
  | 'multiple_choice'
  | 'multiple_choice_5'
  | 'multiple_choice_group'
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'matching_headings'
  | 'matching_information'
  | 'matching_features'
  | 'matching_sentence_endings'
  | 'sentence_completion'
  | 'summary_completion'
  | 'note_completion'
  | 'table_completion'
  | 'flow_chart_completion'
  | 'diagram_labelling'
  | 'short_answer_questions'
  | 'matching_phrases'
  | 'choose_two_letters';

export interface Question {
  id: number;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  note?: string;
  order_index: number;
  group_id?: string;
  passage_id: number;
}

export interface QuestionGroup {
  id: string;
  questionType: QuestionType;
  content: string;
  questions: Question[];
  passage_id: number;
}

export interface QuestionFormData {
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  note?: string;
  order_index: number;
  group_id?: string;
}

export interface QuestionActions {
  fetchQuestions: (passageId: number) => Promise<void>;
  createQuestion: (passageId: number, data: QuestionFormData) => Promise<void>;
  updateQuestion: (id: number, data: QuestionFormData) => Promise<void>;
  deleteQuestion: (id: number) => Promise<void>;
  reorderQuestions: (passageId: number, questions: Question[]) => Promise<void>;
}

export interface QuestionListProps {
  questions: Question[];
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: number) => void;
  onReorderQuestions: (questions: Question[]) => void;
  loading?: boolean;
}

export interface QuestionFormProps {
  question?: Question;
  passageId: number;
  onSubmit: (data: QuestionFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface BulkAnswerData {
  answers: Array<{
    question_number: string;
    answer: string;
    explanation?: string;
    order_index: number;
  }>;
}