import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

// Tạo một client mới để đảm bảo có các model mới nhất
const prismaClient = new PrismaClient();

// Hàm chuyển đổi BigInt thành Number
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }
  
  return obj;
}

// Kiểm tra và tạo bảng nếu cần
async function ensureTableExists() {
  try {
    // Kiểm tra xem bảng có tồn tại không
    await prismaClient.$executeRaw`
      SELECT 1 FROM user_lesson_progress LIMIT 1;
    `;
    console.log('Bảng user_lesson_progress đã tồn tại');
  } catch (error) {
    console.log('Bảng user_lesson_progress không tồn tại, đang tạo...');
    
    // Tạo bảng nếu không tồn tại
    try {
      await prismaClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS user_lesson_progress (
          id INT AUTO_INCREMENT PRIMARY KEY,
          firebase_uid VARCHAR(191) NOT NULL,
          lesson_id INT NOT NULL,
          current_sentence INT NOT NULL DEFAULT 0,
          completed BOOLEAN NOT NULL DEFAULT false,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          UNIQUE INDEX user_lesson_progress_firebase_uid_lesson_id_key(firebase_uid, lesson_id),
          INDEX user_lesson_progress_firebase_uid_idx(firebase_uid),
          INDEX user_lesson_progress_lesson_id_fkey(lesson_id),
          FOREIGN KEY (lesson_id) REFERENCES WritingLesson(id) ON DELETE CASCADE ON UPDATE CASCADE
        );
      `;
      console.log('Đã tạo bảng user_lesson_progress');
    } catch (createError) {
      console.error('Lỗi khi tạo bảng:', createError);
    }
  }
}

// Đảm bảo bảng tồn tại khi khởi động API
ensureTableExists().catch(console.error);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: Lấy tiến độ học tập của người dùng
  if (req.method === 'GET') {
    try {
      const { firebase_uid, lesson_id } = req.query;

      if (!firebase_uid) {
        return res.status(400).json({ error: 'Thiếu firebase_uid' });
      }

      // Truy vấn trực tiếp bằng SQL
      let query = `
        SELECT p.*, l.title, l.level, l.type, 
          (SELECT COUNT(*) FROM WritingSentence WHERE lesson_id = p.lesson_id) as total_sentences
        FROM user_lesson_progress p
        JOIN WritingLesson l ON p.lesson_id = l.id
        WHERE p.firebase_uid = ?
      `;
      
      const queryParams = [String(firebase_uid)];
      
      if (lesson_id) {
        query += ` AND p.lesson_id = ?`;
        queryParams.push(String(lesson_id));
      }
      
      query += ` ORDER BY p.updated_at DESC`;
      
      const results = await prismaClient.$queryRawUnsafe(query, ...queryParams);

      // Chuyển đổi kết quả và xử lý BigInt
      const progress = Array.isArray(results) ? results.map((row: any) => {
        const convertedRow = convertBigIntToNumber(row);
        return {
          id: convertedRow.id,
          firebase_uid: convertedRow.firebase_uid,
          lesson_id: convertedRow.lesson_id,
          current_sentence: convertedRow.current_sentence,
          completed: Boolean(convertedRow.completed),
          created_at: convertedRow.created_at,
          updated_at: convertedRow.updated_at,
          lesson: {
            id: convertedRow.lesson_id,
            title: convertedRow.title,
            level: convertedRow.level,
            type: convertedRow.type,
            sentences: {
              length: convertedRow.total_sentences
            }
          }
        };
      }) : [];

      return res.status(200).json(progress);
    } catch (error) {
      console.error('Lỗi khi lấy tiến độ học tập:', error);
      return res.status(500).json({ error: 'Lỗi server', detail: String(error) });
    }
  }
  
  // POST: Cập nhật tiến độ học tập
  else if (req.method === 'POST') {
    try {
      const { firebase_uid, lesson_id, current_sentence, completed } = req.body;

      if (!firebase_uid || !lesson_id) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }

      // Kiểm tra lesson_id có tồn tại không
      const lesson = await prismaClient.writingLesson.findUnique({
        where: { id: Number(lesson_id) },
        include: {
          sentences: {
            select: { id: true }
          }
        }
      });

      if (!lesson) {
        return res.status(400).json({ error: `LessonId ${lesson_id} không tồn tại` });
      }

      // Kiểm tra current_sentence có hợp lệ không
      if (current_sentence !== undefined && (current_sentence < 0 || current_sentence >= lesson.sentences.length)) {
        return res.status(400).json({ 
          error: `current_sentence không hợp lệ. Phải từ 0 đến ${lesson.sentences.length - 1}` 
        });
      }

      // Tìm kiếm bản ghi hiện có
      const existingProgressQuery = `
        SELECT * FROM user_lesson_progress 
        WHERE firebase_uid = ? AND lesson_id = ?
        LIMIT 1
      `;
      const existingProgress = await prismaClient.$queryRawUnsafe(existingProgressQuery, String(firebase_uid), Number(lesson_id));
      
      let result;
      
      if (existingProgress && Array.isArray(existingProgress) && existingProgress.length > 0) {
        // Cập nhật nếu đã tồn tại
        const currentSentenceValue = current_sentence !== undefined ? Number(current_sentence) : existingProgress[0].current_sentence;
        const completedValue = completed !== undefined ? Boolean(completed) : existingProgress[0].completed;
        
        // Sử dụng $executeRaw với template literals để tránh lỗi kiểu dữ liệu
        await prismaClient.$executeRaw`
          UPDATE user_lesson_progress 
          SET current_sentence = ${currentSentenceValue}, 
              completed = ${completedValue ? 1 : 0}, 
              updated_at = NOW()
          WHERE id = ${existingProgress[0].id}
        `;
        
        result = convertBigIntToNumber({
          ...existingProgress[0],
          current_sentence: currentSentenceValue,
          completed: completedValue
        });
      } else {
        // Tạo mới nếu chưa tồn tại
        const currentSentenceValue = current_sentence !== undefined ? Number(current_sentence) : 0;
        const completedValue = completed !== undefined ? Boolean(completed) : false;
        
        // Sử dụng $executeRaw với template literals để tránh lỗi kiểu dữ liệu
        await prismaClient.$executeRaw`
          INSERT INTO user_lesson_progress (firebase_uid, lesson_id, current_sentence, completed, created_at, updated_at)
          VALUES (${String(firebase_uid)}, ${Number(lesson_id)}, ${currentSentenceValue}, ${completedValue ? 1 : 0}, NOW(), NOW())
        `;
        
        const newProgressQuery = `
          SELECT * FROM user_lesson_progress 
          WHERE firebase_uid = ? AND lesson_id = ?
          ORDER BY id DESC LIMIT 1
        `;
        const newProgress = await prismaClient.$queryRawUnsafe(newProgressQuery, String(firebase_uid), Number(lesson_id));
        
        result = Array.isArray(newProgress) && newProgress.length > 0 ? convertBigIntToNumber(newProgress[0]) : null;
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Lỗi khi cập nhật tiến độ học tập:', error);
      return res.status(500).json({ error: 'Lỗi server', detail: String(error) });
    }
  }
  
  // Các phương thức khác không được hỗ trợ
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 