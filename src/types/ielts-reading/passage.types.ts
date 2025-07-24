export interface Passage {
  id: number;
  title: string;
  content: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  genre?: string;
  time_limit: number;
  is_active: boolean;
  question_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface PassageFormData {
  title: string;
  content: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  time_limit: number;
  is_active: boolean;
}

export interface PassageActions {
  fetchPassages: () => Promise<void>;
  createPassage: (data: PassageFormData) => Promise<void>;
  updatePassage: (id: number, data: PassageFormData) => Promise<void>;
  deletePassage: (id: number) => Promise<void>;
  selectPassage: (passage: Passage | null) => void;
}

export interface PassageListProps {
  passages: Passage[];
  selectedPassage: Passage | null;
  onSelect: (passage: Passage) => void;
  onEdit: (passage: Passage) => void;
  onDelete: (id: number) => Promise<void>;
  onDuplicate: (id: number) => Promise<void>;
  onToggleStatus: (id: number, is_active: boolean) => Promise<void>;
  loading?: boolean;
}

export interface PassageCardProps {
  passage: Passage;
  isSelected?: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export interface PassageFormProps {
  passage?: Passage;
  onSubmit: (data: PassageFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}