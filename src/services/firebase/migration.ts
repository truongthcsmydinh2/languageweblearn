import { migrateUserVocabToNewSchema, initializeLearningStructure } from './database';

// Hàm tổng để thực hiện migration
export async function migrateUserData(userId: string) {
  try {
    console.log('Starting data migration for user:', userId);
    
    // 1. Khởi tạo cấu trúc học tập mới
    console.log('Initializing learning structure...');
    await initializeLearningStructure(userId);
    
    // 2. Cập nhật schema từ vựng
    console.log('Migrating vocabulary to new schema...');
    await migrateUserVocabToNewSchema(userId);
    
    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
