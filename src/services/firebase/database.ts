import { ref, get, set, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { db } from './index';

// Interface cho dữ liệu từ vựng
export interface Term {
  id: string;
  vocab: string;
  meaning: string;
  level: number;
  memoryStrength?: number;
  lastReviewed?: string | null;
  nextReviewDate?: string | null;
  setId?: string;
  part_of_speech?: string;
}

export interface VocabSet {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  terms: Record<string, Term>;
}

export interface LearningHistory {
  reviews: {
    date: string;
    result: 'correct' | 'incorrect';
    responseTime?: number;
  }[];
  averageAccuracy: number;
}

// Fetch user data
export async function getUserData(userId: string) {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

// Update user data
export async function updateUserData(userId: string, data: any) {
  try {
    const userRef = ref(db, `users/${userId}`);
    return update(userRef, data);
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
}

// Fetch vocabulary sets
export async function getVocabSets(userId: string) {
  try {
    const vocabRef = ref(db, `vocab/${userId}`);
    const snapshot = await get(vocabRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error("Error fetching vocabulary sets:", error);
    throw error;
  }
}

// Create vocabulary set
export async function createVocabSet(userId: string, setId: string, setData: VocabSet) {
  try {
    const vocabSetRef = ref(db, `vocab/${userId}/${setId}`);
    return set(vocabSetRef, setData);
  } catch (error) {
    console.error("Error creating vocabulary set:", error);
    throw error;
  }
}

// Update vocabulary set
export async function updateVocabSet(userId: string, setId: string, setData: Partial<VocabSet>) {
  try {
    const vocabSetRef = ref(db, `vocab/${userId}/${setId}`);
    return update(vocabSetRef, setData);
  } catch (error) {
    console.error("Error updating vocabulary set:", error);
    throw error;
  }
}

// Delete vocabulary set
export async function deleteVocabSet(userId: string, setId: string) {
  try {
    const vocabSetRef = ref(db, `vocab/${userId}/${setId}`);
    return remove(vocabSetRef);
  } catch (error) {
    console.error("Error deleting vocabulary set:", error);
    throw error;
  }
}

// Create term
export async function createTerm(userId: string, setId: string, termId: string, termData: Term) {
  try {
    const termRef = ref(db, `vocab/${userId}/${setId}/terms/${termId}`);
    return set(termRef, termData);
  } catch (error) {
    console.error("Error creating term:", error);
    throw error;
  }
}

// Update term
export async function updateTerm(userId: string, setId: string, termId: string, termData: Partial<Term>) {
  try {
    const termRef = ref(db, `vocab/${userId}/${setId}/terms/${termId}`);
    return update(termRef, termData);
  } catch (error) {
    console.error("Error updating term:", error);
    throw error;
  }
}

// Delete term
export async function deleteTerm(userId: string, setId: string, termId: string) {
  try {
    const termRef = ref(db, `vocab/${userId}/${setId}/terms/${termId}`);
    return remove(termRef);
  } catch (error) {
    console.error("Error deleting term:", error);
    throw error;
  }
}

// Learning history operations
export async function getLearningHistory(userId: string) {
  try {
    const historyRef = ref(db, `learning/${userId}/history`);
    const snapshot = await get(historyRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error("Error fetching learning history:", error);
    throw error;
  }
}

export async function updateLearningHistory(userId: string, termId: string, historyData: Partial<LearningHistory>) {
  try {
    const historyRef = ref(db, `learning/${userId}/history/${termId}`);
    return update(historyRef, historyData);
  } catch (error) {
    console.error("Error updating learning history:", error);
    throw error;
  }
}

// Migration function để cập nhật schema
export async function migrateUserVocabToNewSchema(userId: string) {
  try {
    // 1. Lấy dữ liệu từ vựng hiện tại
    const vocabSets = await getVocabSets(userId);
    
    // 2. Duyệt qua từng set và từng term, thêm các trường mới
    for (const setId in vocabSets) {
      const set = vocabSets[setId];
      
      // Kiểm tra xem set có terms không
      if (set.terms) {
        for (const termId in set.terms) {
          const term = set.terms[termId];
          
          // Chỉ cập nhật nếu chưa có các trường mới
          if (!term.memoryStrength && !term.nextReviewDate) {
            // Thêm các trường mới với giá trị mặc định
            const updatedTerm = {
              ...term,
              memoryStrength: 0,
              lastReviewed: null,
              nextReviewDate: null
            };
            
            // Cập nhật term
            await updateTerm(userId, setId, termId, updatedTerm);
          }
        }
      }
      
      // Đảm bảo set có trường updatedAt
      if (!set.updatedAt) {
        await updateVocabSet(userId, setId, {
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error migrating vocab to new schema:", error);
    throw error;
  }
}

// Khởi tạo cấu trúc học tập mới cho người dùng
export async function initializeLearningStructure(userId: string) {
  try {
    const learningRef = ref(db, `learning/${userId}`);
    const snapshot = await get(learningRef);
    
    // Chỉ khởi tạo nếu chưa tồn tại
    if (!snapshot.exists()) {
      await set(learningRef, {
        history: {},
        stats: {
          totalLearned: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          streak: 0,
          lastStudied: null
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing learning structure:", error);
    throw error;
  }
}

export const getDataFromPath = (path) => {
  // Sử dụng db đã import
};
