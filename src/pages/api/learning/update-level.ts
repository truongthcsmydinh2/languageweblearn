import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

// Hàm lấy ngày hiện tại theo múi giờ Việt Nam (GMT+7)
function getTodayStrGMT7() {
  const now = new Date();
  
  // Tạo ngày theo múi giờ Việt Nam (GMT+7)
  // Sử dụng Intl.DateTimeFormat để đảm bảo chính xác
  const vietnamDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  
  return vietnamDate; // Định dạng yyyy-mm-dd
}

// Hàm tính thời gian ôn tập tiếp theo dựa trên level (sử dụng múi giờ Việt Nam)
function calculateNextReviewTime(level: number): number {
  const now = new Date();
  
  const vietnamDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  
  const vietnamTime = new Date(vietnamDate + 'T00:00:00.000Z');

  // SỬA: Nếu level 0, trả về timestamp của ngày hôm nay
  if (level === 0) {
    return vietnamTime.getTime();
  }
  
  let next = new Date(vietnamTime);
  
  switch (level) {
    case 1: next.setDate(vietnamTime.getDate() + 1); break;
    case 2: next.setDate(vietnamTime.getDate() + 2); break;
    case 3: next.setDate(vietnamTime.getDate() + 3); break;
    case 4: next.setDate(vietnamTime.getDate() + 4); break;
    case 5: next.setDate(vietnamTime.getDate() + 7); break;
    case 6: next.setDate(vietnamTime.getDate() + 14); break;
    case 7: next.setMonth(vietnamTime.getMonth() + 1); break;
    case 8: next.setMonth(vietnamTime.getMonth() + 2); break;
    case 9: next.setMonth(vietnamTime.getMonth() + 3); break;
    case 10: next.setMonth(vietnamTime.getMonth() + 6); break;
    // SỬA: Mặc định trả về timestamp của ngày hôm nay
    default:
      return vietnamTime.getTime();
  }
  
  // SỬA: Trả về timestamp dạng số
  return next.getTime();
}

// Hàm tính toán level mới dựa trên kết quả trả lời
function calculateNewLevel(currentLevel: number, isCorrect: boolean): number {
  if (isCorrect) {
    // Nếu trả lời đúng, tăng level (tối đa là 10)
    return Math.min(10, currentLevel + 1);
  } else {
    // Nếu trả lời sai, giảm level theo logic thông minh hơn
    if (currentLevel <= 2) {
      // Với level thấp (0-2), giảm về 0 (từ mới)
      return 0;
    } else if (currentLevel <= 5) {
      // Với level trung bình (3-5), giảm 2 level
      return Math.max(0, currentLevel - 2);
    } else {
      // Với level cao (6-10), giảm 1 level
      return Math.max(0, currentLevel - 1);
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { term_id, is_correct, mode } = req.body;
    
    if (!term_id || typeof is_correct !== 'boolean' || !mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (mode !== 'en_to_vi' && mode !== 'vi_to_en') {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    // Lấy thông tin từ vựng hiện tại
    const [terms] = await db.query(
      'SELECT * FROM terms WHERE id = ? AND firebase_uid = ?',
      [term_id, firebase_uid]
    );

    if (!terms || (terms as any[]).length === 0) {
      return res.status(404).json({ error: 'Term not found' });
    }

    const term = (terms as any[])[0];
    
    // Xác định level hiện tại và field cần cập nhật
    let currentLevel: number;
    let fieldToUpdate: string;
    let reviewTimeField: string;
    
    if (mode === 'en_to_vi') {
      currentLevel = term.level_en || 0;
      fieldToUpdate = 'level_en';
      reviewTimeField = 'review_time_en';
    } else {
      currentLevel = term.level_vi || 0;
      fieldToUpdate = 'level_vi';
      reviewTimeField = 'review_time_vi';
    }

    // Tính toán level mới với logic cải tiến
    const newLevel = calculateNewLevel(currentLevel, is_correct);

    // Tính thời gian ôn tập tiếp theo
    const nextReviewTime = calculateNextReviewTime(newLevel);
    
    // Cập nhật vào database
    await db.query(
      `UPDATE terms SET ${fieldToUpdate} = ?, ${reviewTimeField} = ? WHERE id = ? AND firebase_uid = ?`,
      [newLevel, nextReviewTime, term_id, firebase_uid]
    );

    // Tạo thông báo chi tiết về thay đổi level
    let levelChangeMessage = '';
    if (is_correct) {
      if (newLevel === 10) {
        levelChangeMessage = 'Tuyệt vời! Từ này đã đạt cấp độ cao nhất (10)';
      } else {
        levelChangeMessage = `Tốt! Level tăng từ ${currentLevel} lên ${newLevel}`;
      }
    } else {
      if (newLevel === 0) {
        levelChangeMessage = 'Từ này sẽ được học lại như từ mới';
      } else {
        levelChangeMessage = `Level giảm từ ${currentLevel} xuống ${newLevel}`;
      }
    }

    // Trả về kết quả chi tiết hơn
    const response = {
      success: true,
      term_id,
      field_updated: fieldToUpdate,
      old_level: currentLevel,
      new_level_en: mode === 'en_to_vi' ? newLevel : term.level_en,
      new_level_vi: mode === 'vi_to_en' ? newLevel : term.level_vi,
      next_review_time_en: mode === 'en_to_vi' ? nextReviewTime : term.review_time_en,
      next_review_time_vi: mode === 'vi_to_en' ? nextReviewTime : term.review_time_vi,
      level_change_message: levelChangeMessage,
      next_review_days: getDaysUntilReview(nextReviewTime)
    };

    console.log(`Level update for term ${term_id} (${mode}): ${currentLevel} -> ${newLevel}, next review: ${nextReviewTime}`);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error updating level:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Hàm tính số ngày đến lần ôn tập tiếp theo (sử dụng múi giờ Việt Nam)
// SỬA: Thay đổi kiểu tham số từ string -> number
function getDaysUntilReview(nextReviewTimestamp: number): number {
  const todayStr = getTodayStrGMT7(); // Lấy 'yyyy-mm-dd' của hôm nay
  const todayDate = new Date(todayStr + 'T00:00:00.000Z');

  // Tạo đối tượng Date trực tiếp từ timestamp
  const nextReviewDateObj = new Date(nextReviewTimestamp);
  
  const diffTime = nextReviewDateObj.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}