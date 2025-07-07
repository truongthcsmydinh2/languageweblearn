import { ref, get, set, push, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/firebase/config';
import { db as mysqlDb } from '@/lib/mysql';

export interface Term {
  id: number;
  vocab: string;
  meaning: string;
  example?: string;
  notes?: string;
  level_en: number;
  level_vi: number;
  time_added: Date;
  review_time_en: Date;
  review_time_vi: Date;
  set_id: number;
}

// Chỉ sử dụng một định nghĩa cho DatabaseService
const DatabaseService = {
  // Lấy tất cả các bộ từ vựng
  async getAllVocabSets(userId: string): Promise<Term[]> {
    try {
      const [rows] = await mysqlDb.execute(
        'SELECT * FROM terms WHERE user_id = ? ORDER BY time_added DESC',
        [userId]
      );
      return rows as Term[];
    } catch (error) {
      console.error('Error getting vocab sets:', error);
      throw error;
    }
  },

  // Thêm một từ vựng mới
  async addVocabTerm(userId: string, term: Term) {
    try {
      await mysqlDb.execute(
        'INSERT INTO terms (user_id, vocab, meaning, level_en, level_vi, time_added, review_time_en, review_time_vi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, term.vocab, term.meaning, term.level_en, term.level_vi, term.time_added, term.review_time_en, term.review_time_vi]
      );
    } catch (error) {
      console.error('Error adding vocab term:', error);
      throw error;
    }
  },

  // Thêm nhiều từ vựng cùng lúc
  async addMultipleVocabTerms(userId: string, terms: Term[]) {
    try {
      const values = terms.map(term => 
        [userId, term.vocab, term.meaning, term.level_en, term.level_vi, term.time_added, term.review_time_en, term.review_time_vi]
      );
      
      // Sử dụng query để thêm nhiều dòng
      await mysqlDb.query(
        'INSERT INTO terms (user_id, vocab, meaning, level_en, level_vi, time_added, review_time_en, review_time_vi) VALUES ?',
        [values]
      );
    } catch (error) {
      console.error('Error adding multiple terms:', error);
      throw error;
    }
  },

  // Xóa một từ vựng
  async deleteVocabTerms(userId: string, vocab: string) {
    try {
      await mysqlDb.execute(
        'DELETE FROM terms WHERE user_id = ? AND vocab = ?',
        [userId, vocab]
      );
    } catch (error) {
      console.error('Error deleting vocab terms:', error);
      throw error;
    }
  },

  // Xóa tất cả từ vựng của một người dùng
  async deleteAllTerms(userId: string) {
    try {
      await mysqlDb.execute(
        'DELETE FROM terms WHERE user_id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error deleting all terms:', error);
      throw error;
    }
  }
};

export { DatabaseService };

// Xuất ra hàm riêng để tương thích với code cũ
export async function deleteVocabTerms(userId: string, vocab: string) {
  return DatabaseService.deleteVocabTerms(userId, vocab);
}

export class DatabaseService {
  // Lấy tất cả các bộ từ vựng
  static async getAllVocabSets(userId: string) {
    try {
      console.log("Getting vocab sets for user:", userId);
      
      // Kiểm tra xem node vocabSets đã tồn tại chưa
      const rootRef = ref(db);
      const rootSnapshot = await get(rootRef);
      
      // Nếu node vocabSets chưa tồn tại, tạo mới
      if (!rootSnapshot.hasChild('vocabSets')) {
        console.log("Creating vocabSets node");
        await set(ref(db, 'vocabSets'), {});
        return [];
      }
      
      // Lấy tất cả vocabSets
      const vocabSetsRef = ref(db, 'vocabSets');
      const snapshot = await get(vocabSetsRef);
      
      if (!snapshot.exists()) {
        console.log("No vocab sets found");
        return [];
      }
      
      const data = snapshot.val();
      const userSets = [];
      
      // Lọc theo userId tại client
      for (const key in data) {
        if (data[key] && data[key].userId === userId) {
          userSets.push({
            id: key,
            ...data[key]
          });
        }
      }
      
      console.log(`Found ${userSets.length} vocab sets for user ${userId}`);
      return userSets;
    } catch (error) {
      console.error('Error getting vocab sets:', error);
      throw error;
    }
  }

  // Lấy bộ từ vựng theo ID
  static async getVocabSetById(setId: string) {
    try {
      const setRef = ref(db, `vocabSets/${setId}`);
      const snapshot = await get(setRef);
      
      if (snapshot.exists()) {
        return {
          id: setId,
          ...snapshot.val()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting vocab set:', error);
      throw error;
    }
  }

  // Tạo bộ từ vựng mới
  static async createVocabSet(data: any) {
    try {
      const newSetRef = push(ref(db, 'vocabSets'));
      await set(newSetRef, {
        ...data,
        createdAt: Date.now()
      });
      
      return {
        id: newSetRef.key,
        ...data
      };
    } catch (error) {
      console.error('Error creating vocab set:', error);
      throw error;
    }
  }

  // Cập nhật bộ từ vựng
  static async updateVocabSet(setId: string, data: any) {
    try {
      const setRef = ref(db, `vocabSets/${setId}`);
      await update(setRef, {
        ...data,
        updatedAt: Date.now()
      });
      
      return {
        id: setId,
        ...data
      };
    } catch (error) {
      console.error('Error updating vocab set:', error);
      throw error;
    }
  }

  // Xóa bộ từ vựng
  static async deleteVocabSet(setId: string) {
    try {
      const setRef = ref(db, `vocabSets/${setId}`);
      await remove(setRef);
      return true;
    } catch (error) {
      console.error('Error deleting vocab set:', error);
      throw error;
    }
  }

  static async addVocabTerm(userId: string, term: any) {
    try {
      // Lấy reference đến default vocab set
      const vocabRef = ref(db, `vocab/${userId}/default`);
      const snapshot = await get(vocabRef);
      
      if (!snapshot.exists()) {
        // Nếu chưa có default set, tạo mới
        await set(vocabRef, {
          title: 'Default Set',
          description: 'Default vocabulary set',
          terms: [term]
        });
      } else {
        // Nếu đã có, thêm term vào mảng terms
        const data = snapshot.val();
        const terms = Array.isArray(data.terms) ? data.terms : [];
        terms.push(term);
        
        await set(vocabRef, {
          ...data,
          terms
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error adding vocab term:', error);
      throw error;
    }
  }

  static async addMultipleVocabTerms(userId: string, newTerms: any[]) {
    try {
      // Lấy reference đến default vocab set
      const vocabRef = ref(db, `vocab/${userId}/default`);
      const snapshot = await get(vocabRef);
      
      if (!snapshot.exists()) {
        // Nếu chưa có default set, tạo mới với các từ mới
        await set(vocabRef, {
          title: 'Default Set',
          description: 'Default vocabulary set',
          terms: newTerms
        });
      } else {
        // Nếu đã có, thêm các từ mới vào mảng terms hiện tại
        const data = snapshot.val();
        const currentTerms = Array.isArray(data.terms) ? data.terms : [];
        
        await set(vocabRef, {
          ...data,
          terms: [...currentTerms, ...newTerms]
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error adding multiple vocab terms:', error);
      throw error;
    }
  }
}

// Xóa các từ vựng
export const deleteVocabTerms = async (userId: string, term: string) => {
  try {
    console.log(`Deleting term "${term}" for user ${userId}`);
    
    // Lấy tất cả từ vựng
    const vocabRef = ref(db, 'vocab');
    const snapshot = await get(vocabRef);
    
    if (!snapshot.exists()) {
      console.log("No vocab terms found");
      return false;
    }
    
    const data = snapshot.val();
    let deletedCount = 0;
    
    // Tìm và xóa các term khớp với điều kiện
    for (const key in data) {
      if (data[key] && data[key].userId === userId && data[key].vocab === term) {
        await remove(ref(db, `vocab/${key}`));
        deletedCount++;
      }
    }
    
    console.log(`Deleted ${deletedCount} terms`);
    return deletedCount > 0;
  } catch (error) {
    console.error('Error deleting vocab terms:', error);
    throw error;
  }
}; 