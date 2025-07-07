export interface Term {
  vocab: string;
  meaning: string;
  level: number;
  timeAdded: number;
  reviewTime: number;
}

export interface VocabSet {
  id: string;
  title: string;
  description: string;
  terms: Term[];
  firebaseId?: string;
}

export interface CreateVocabSetData {
  title: string;
  description?: string;
  terms: Omit<Term, 'id' | 'createdAt'>[];
}

export interface VocabWord {
  id: string;
  text: string;
  meaning: string;
  level: number;             // 1-10
  wrongCount: number;        // Số lần trả lời sai
  dueDate: Date | null;      // Ngày đến hạn ôn tập
  isLearned: boolean;        // Đã học chưa
  section: number;           // Thuộc phần nào (1-5)
  lastReviewDate: Date | null; // Ngày ôn tập gần nhất
  sessionStatus?: {          // Trạng thái trong phiên học hiện tại
    hasAnswered: boolean;    // Đã trả lời trong phiên này chưa
    isCorrect: boolean;      // Trả lời đúng hay sai
    hasChangedLevel: boolean; // Đã thay đổi level trong phiên này chưa
  };
}

export interface LearningSession {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date | null;
  section: number;           // Phần đang học (1-6)
  newWords: string[];        // ID của từ mới trong phiên
  reviewWords: string[];     // ID của từ ôn tập trong phiên
  progress: {
    completed: number;       // Số từ đã hoàn thành
    correct: number;         // Số câu trả lời đúng
    incorrect: number;       // Số câu trả lời sai
  };
  isCompleted: boolean;
} 