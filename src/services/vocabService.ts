import { v4 as uuidv4 } from 'uuid';
import { 
  getVocabSets, 
  createVocabSet, 
  updateVocabSet, 
  deleteVocabSet,
  createTerm,
  updateTerm,
  deleteTerm,
  Term,
  VocabSet
} from './firebase/database';
import { isDue } from '../utils/src';
import { VocabWord, LearningSession } from '@/types/vocab';
import { ref, get, set, push, update, remove } from 'firebase/database';
import { db } from '@/firebase/config';

// Fetch user vocabulary sets
export async function fetchUserVocabSets(userId: string): Promise<Record<string, VocabSet>> {
  console.log('Đang lấy vocab sets cho user ID:', userId);
  
  try {
    const vocabRef = ref(db, `vocab/${userId}`);
    console.log('Đường dẫn truy vấn vocab:', `vocab/${userId}`);
    
    const snapshot = await get(vocabRef);
    console.log('Snapshot exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('Vocab data lấy được:', data);
      return data;
    } else {
      console.log('Không tìm thấy dữ liệu vocab cho user này');
      return {};
    }
  } catch (error) {
    console.error('Lỗi khi lấy vocab sets:', error);
    throw error;
  }
}

// Create a new vocabulary set
export async function createNewVocabSet(
  userId: string, 
  name: string, 
  description: string = ''
): Promise<VocabSet> {
  const setId = uuidv4();
  const now = new Date().toISOString();
  
  const newSet: VocabSet = {
    id: setId,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    terms: {}
  };
  
  await createVocabSet(userId, setId, newSet);
  return newSet;
}

// Update vocabulary set details
export async function updateVocabSetDetails(
  userId: string,
  setId: string,
  name: string,
  description: string = ''
): Promise<string> {
  const updatedData = {
    name,
    description,
    updatedAt: new Date().toISOString()
  };
  
  await updateVocabSet(userId, setId, updatedData);
  return setId;
}

// Delete a vocabulary set
export async function deleteVocabSetAndTerms(
  userId: string,
  setId: string
): Promise<string> {
  await deleteVocabSet(userId, setId);
  return setId;
}

// Add term to vocabulary set
export async function addTermToSet(
  userId: string,
  setId: string,
  vocab: string,
  meaning: string,
  part_of_speech?: string
): Promise<Term> {
  const termId = uuidv4();
  
  const newTerm: Term = {
    id: termId,
    vocab,
    meaning,
    level: 0,
    memoryStrength: 0,
    lastReviewed: null,
    nextReviewDate: null,
    part_of_speech
  };
  
  await createTerm(userId, setId, termId, newTerm);
  
  // Update set's updatedAt timestamp
  await updateVocabSet(userId, setId, { 
    updatedAt: new Date().toISOString() 
  });
  
  return newTerm;
}

// Update an existing term
export async function updateExistingTerm(
  userId: string,
  setId: string,
  termId: string,
  termData: Partial<Term>
): Promise<string> {
  await updateTerm(userId, setId, termId, termData);
  
  // Update set's updatedAt timestamp
  await updateVocabSet(userId, setId, { 
    updatedAt: new Date().toISOString() 
  });
  
  return termId;
}

// Delete a term
export async function deleteExistingTerm(
  userId: string,
  setId: string,
  termId: string
): Promise<string> {
  await deleteTerm(userId, setId, termId);
  
  // Update set's updatedAt timestamp
  await updateVocabSet(userId, setId, { 
    updatedAt: new Date().toISOString() 
  });
  
  return termId;
}

// Get terms that are due for review
export async function getDueTerms(userId: string): Promise<Term[]> {
  const vocabSets = await getVocabSets(userId);
  const dueTerms: Term[] = [];
  
  // Iterate through all sets and terms
  Object.entries(vocabSets).forEach(([setId, set]) => {
    const setObj = set as { terms?: Record<string, Term> };
    if (setObj.terms) {
      Object.entries(setObj.terms).forEach(([termId, term]) => {
        const termObj = term as Term;
        // Add setId to term for reference
        const termWithSetId = { ...termObj, setId };
        // Check if term is due for review
        const nextReviewDate = termObj.nextReviewDate ?? null;
        if (isDue(nextReviewDate)) {
          dueTerms.push(termWithSetId);
        }
      });
    }
  });
  
  return dueTerms;
}

// Filter terms by level
export async function getTermsByLevel(
  userId: string,
  level: number
): Promise<Term[]> {
  const vocabSets = await getVocabSets(userId);
  const terms: Term[] = [];
  
  // Iterate through all sets and terms
  Object.entries(vocabSets).forEach(([setId, set]) => {
    const setObj = set as { terms?: Record<string, Term> };
    if (setObj.terms) {
      Object.entries(setObj.terms).forEach(([termId, term]) => {
        const termObj = term as Term;
        // Add setId to term for reference
        const termWithSetId = { ...termObj, setId };
        
        // Check if term matches the level
        if (termObj.level === level) {
          terms.push(termWithSetId);
        }
      });
    }
  });
  
  return terms;
}

// Import terms in bulk
export async function importTerms(
  userId: string,
  setId: string,
  terms: Array<{ vocab: string; meaning: string }>
): Promise<Term[]> {
  const createdTerms: Term[] = [];
  
  // Process each term
  for (const { vocab, meaning } of terms) {
    const newTerm = await addTermToSet(userId, setId, vocab, meaning);
    createdTerms.push(newTerm);
  }
  
  return createdTerms;
}

// Export các hàm riêng lẻ
export const getAllVocabSets = async (userId: string) => {
  console.log('getAllVocabSets với userId:', userId);
  try {
    // Đường dẫn chính xác đến vocab của user
    const vocabRef = ref(db, `vocab/${userId}`);
    console.log('Đang truy vấn path:', `vocab/${userId}`);
    
    const snapshot = await get(vocabRef);
    console.log('snapshot.exists():', snapshot.exists());
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return data;
    } else {
      return {};
    }
  } catch (error) {
    console.error('Lỗi trong getAllVocabSets:', error);
    throw error;
  }
};

export const getVocabSet = async (userId: string, setId: string) => {
  try {
    const vocabSetRef = ref(db, `vocab/${userId}/${setId}`);
    const snapshot = await get(vocabSetRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Lỗi khi lấy vocab set:", error);
    throw error;
  }
};

// Chỉ giữ lại object này
const VocabService = {
  getAllVocabSets: async (userId: string) => {
    try {
      const vocabRef = ref(db, `vocab/${userId}`);
      const snapshot = await get(vocabRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return {};
      }
    } catch (error) {
      console.error("Error getting vocab sets:", error);
      throw error;
    }
  },
  
  getVocabSet: async (userId: string, setId: string) => {
    try {
      const vocabSetRef = ref(db, `vocab/${userId}/${setId}`);
      const snapshot = await get(vocabSetRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting vocab set:", error);
      throw error;
    }
  },
  
  // Phân chia từ vựng thành 5 phần bằng nhau
  divideSections: (words: VocabWord[]): VocabWord[] => {
    const totalWords = words.length;
    const sectionSize = Math.ceil(totalWords / 5);
    
    return words.map((word, index) => ({
      ...word,
      section: Math.floor(index / sectionSize) + 1
    }));
  },
  
  // Lấy danh sách từ cho phiên học mới
  getWordsForSession: (
    allWords: VocabWord[], 
    section: number, 
    userId: string
  ): LearningSession => {
    // Từ mới cho phần này
    const newWords = allWords
      .filter(word => word.section === section && !word.isLearned)
      .map(word => word.id);
      
    // Từ cần ôn tập (từ các phần trước trả lời sai)
    let reviewWords: string[] = [];
    
    if (section <= 5) {
      // Với phần 1-5: lấy từ sai từ các phần trước
      reviewWords = allWords
        .filter(word => 
          word.section < section && 
          word.wrongCount > 0 && 
          word.isLearned
        )
        .sort((a, b) => b.wrongCount - a.wrongCount) // Sắp xếp theo số lần sai
        .map(word => word.id);
    } else {
      // Với phần 6: chỉ lấy từ khó (sai > 3 lần)
      reviewWords = allWords
        .filter(word => word.wrongCount > 3 && word.isLearned)
        .sort((a, b) => b.wrongCount - a.wrongCount)
        .map(word => word.id);
    }
    
    // Tạo phiên học mới
    return {
      id: `session-${Date.now()}`,
      userId,
      startDate: new Date(),
      endDate: null,
      section,
      newWords,
      reviewWords,
      progress: {
        completed: 0,
        correct: 0,
        incorrect: 0
      },
      isCompleted: false
    };
  },
  
  // Tạo danh sách từ hiển thị cho người dùng, đảm bảo tỷ lệ 3:1 giữa từ mới và từ ôn tập
  getDisplayWords: (session: LearningSession, allWords: VocabWord[]): VocabWord[] => {
    const { newWords, reviewWords } = session;
    
    // Lấy object từ từ ID
    const newWordsObj = newWords.map(id => allWords.find(w => w.id === id)).filter(Boolean) as VocabWord[];
    const reviewWordsObj = reviewWords.map(id => allWords.find(w => w.id === id)).filter(Boolean) as VocabWord[];
    
    // Tính tổng số từ cần hiển thị, giữ tỷ lệ 3:1
    const totalWords = newWordsObj.length + reviewWordsObj.length;
    const totalSessionTime = totalWords * 30; // 30 giây/từ
    
    // Phân bổ thời gian cho từ mới và từ ôn tập theo tỷ lệ 3:1
    const newWordsTime = totalSessionTime * 0.75;
    const reviewWordsTime = totalSessionTime * 0.25;
    
    // Tính số lượng từ mới và từ ôn tập cần hiển thị
    const newWordsCount = Math.min(newWordsObj.length, Math.ceil(newWordsTime / 30));
    const reviewWordsCount = Math.min(reviewWordsObj.length, Math.ceil(reviewWordsTime / 30));
    
    // Lấy danh sách từ hiển thị
    const selectedNewWords = newWordsObj.slice(0, newWordsCount);
    
    // Lấy từ ôn tập, tần suất xuất hiện tỷ lệ thuận với số lần sai
    let selectedReviewWords: VocabWord[] = [];
    const weightedReviewWords: VocabWord[] = [];
    
    // Tạo danh sách có trọng số
    reviewWordsObj.forEach(word => {
      // Tần suất xuất hiện = số lần sai + 1 (tối thiểu 1, tối đa N+1)
      const frequency = Math.min(word.wrongCount + 1, 10); // Giới hạn tối đa 10 lần
      
      for (let i = 0; i < frequency; i++) {
        weightedReviewWords.push(word);
      }
    });
    
    // Shuffle danh sách có trọng số
    const shuffled = VocabService.shuffleArray([...weightedReviewWords]);
    
    // Lấy unique words theo số lượng cần thiết
    const uniqueIds = new Set<string>();
    for (const word of shuffled) {
      if (!uniqueIds.has(word.id)) {
        uniqueIds.add(word.id);
        selectedReviewWords.push(word);
        
        if (selectedReviewWords.length >= reviewWordsCount) break;
      }
    }
    
    // Kết hợp và xáo trộn kết quả cuối cùng
    return VocabService.shuffleArray([...selectedNewWords, ...selectedReviewWords]);
  },
  
  // Cập nhật từ sau khi trả lời
  updateWordAfterAnswer: (
    word: VocabWord, 
    isCorrect: boolean
  ): VocabWord => {
    // Clone để không thay đổi trực tiếp object
    const updatedWord = { ...word };
    
    // Đánh dấu đã học
    updatedWord.isLearned = true;
    
    // Nếu chưa thay đổi level trong phiên này, thực hiện thay đổi
    if (!updatedWord.sessionStatus?.hasChangedLevel) {
      if (isCorrect) {
        // Trả lời đúng: tăng level (tối đa 10)
        updatedWord.level = Math.min(updatedWord.level + 1, 10);
      } else {
        // Trả lời sai: giảm level (tối thiểu 1) và tăng số lần sai
        updatedWord.level = Math.max(updatedWord.level - 1, 1);
        updatedWord.wrongCount += 1;
      }
      
      // Đánh dấu đã thay đổi level
      if (!updatedWord.sessionStatus) {
        updatedWord.sessionStatus = {
          hasAnswered: true,
          isCorrect,
          hasChangedLevel: true
        };
      } else {
        updatedWord.sessionStatus.hasAnswered = true;
        updatedWord.sessionStatus.isCorrect = isCorrect;
        updatedWord.sessionStatus.hasChangedLevel = true;
      }
    }
    
    // Cập nhật ngày ôn tập gần nhất và tính ngày đến hạn
    updatedWord.lastReviewDate = new Date();
    updatedWord.dueDate = VocabService.calculateDueDate(updatedWord.level);
    
    return updatedWord;
  },
  
  // Tính ngày đến hạn ôn tập dựa trên level (sử dụng múi giờ Việt Nam)
  calculateDueDate: (level: number): Date => {
    const now = new Date();
    // Lấy múi giờ hiện tại của server
    const serverTimezoneOffset = now.getTimezoneOffset(); // phút
    // Múi giờ Việt Nam là GMT+7, tức là -420 phút so với UTC
    const vietnamTimezoneOffset = -420; // phút
    // Tính chênh lệch múi giờ
    const timezoneDiff = vietnamTimezoneOffset - serverTimezoneOffset;
    
    // Tạo ngày theo múi giờ Việt Nam
    const vietnamTime = new Date(now.getTime() + timezoneDiff * 60 * 1000);
    const daysToAdd = VocabService.getDaysToAddBasedOnLevel(level);
    
    const dueDate = new Date(vietnamTime);
    dueDate.setDate(vietnamTime.getDate() + daysToAdd);
    
    return dueDate;
  },
  
  // Số ngày cần thêm vào dựa trên level
  getDaysToAddBasedOnLevel: (level: number): number => {
    // Áp dụng thuật toán Spaced Repetition
    // Level 1: 1 ngày, Level 2: 2 ngày, Level 3: 4 ngày, Level 4: 7 ngày...
    switch (level) {
      case 1: return 1;    // 1 ngày
      case 2: return 2;    // 2 ngày
      case 3: return 4;    // 4 ngày
      case 4: return 7;    // 1 tuần
      case 5: return 14;   // 2 tuần
      case 6: return 30;   // 1 tháng
      case 7: return 60;   // 2 tháng
      case 8: return 120;  // 4 tháng
      case 9: return 240;  // 8 tháng
      case 10: return 365; // 1 năm
      default: return 1;
    }
  },
  
  // Kiểm tra các từ đến hạn ôn tập
  getDueWords: (words: VocabWord[]): VocabWord[] => {
    const now = new Date();
    
    return words.filter(word => 
      word.isLearned && 
      word.dueDate !== null && 
      word.dueDate <= now
    );
  },
  
  // Helper: Shuffle array
  shuffleArray: <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
};

export default VocabService;

// Hàm lấy terms từ một vocab set
export const getVocabTerms = async (userId: string, setId: string) => {
  console.log(`Đang lấy terms từ set ${setId} của user ${userId}`);
  
  try {
    const termsRef = ref(db, `vocab/${userId}/${setId}/terms`);
    console.log('Đường dẫn truy vấn terms:', `vocab/${userId}/${setId}/terms`);
    
    const snapshot = await get(termsRef);
    console.log('Snapshot terms exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const terms = snapshot.val();
      return terms;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Lỗi khi lấy terms:', error);
    throw error;
  }
};
