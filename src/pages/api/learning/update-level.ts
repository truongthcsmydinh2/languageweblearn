import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

// Định nghĩa interface cho Term
interface Term extends RowDataPacket {
  id: number;
  vocab: string;
  meaning: string;
  level_en: number;
  level_vi: number;
  review_time_en: Date | string | number;
  review_time_vi: Date | string | number;
  firebase_uid: string;
  [key: string]: any; // Cho phép các trường khác
}

// Hàm tính toán thời gian ôn tập tiếp theo dựa trên cấp độ
function calculateNextReviewTime(level: number): number {
  const now = new Date();
  
  // Các khoảng thời gian ôn tập (đơn vị: ngày)
  const intervals = [
    1,      // Level 0: 1 ngày
    2,      // Level 1: 2 ngày
    4,      // Level 2: 4 ngày
    7,      // Level 3: 1 tuần
    14,     // Level 4: 2 tuần
    30,     // Level 5: 1 tháng
    60,     // Level 6: 2 tháng
    90,     // Level 7: 3 tháng
    180,    // Level 8: 6 tháng
    365,    // Level 9: 1 năm
    730     // Level 10: 2 năm
  ];
  
  // Lấy khoảng thời gian phù hợp với cấp độ
  const interval = level >= 0 && level < intervals.length 
    ? intervals[level] 
    : intervals[0];
  
  // Tính toán timestamp cho thời gian ôn tập tiếp theo (milliseconds)
  // 1 ngày = 24 giờ * 60 phút * 60 giây * 1000 milliseconds
  const nextTimestamp = now.getTime() + interval * 24 * 60 * 60 * 1000;
  
  console.log(`Calculating next review time for level ${level}:`);
  console.log(`- Current time: ${now.toISOString()} (${now.getTime()})`);
  console.log(`- Interval: ${interval} ngày`);
  console.log(`- Next review timestamp: ${nextTimestamp}`);
  console.log(`- Next review date: ${new Date(nextTimestamp).toISOString()}`);
  
  return nextTimestamp;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { term_id, is_correct, mode } = req.body;
  const firebase_uid = req.headers.firebase_uid as string;

  if (!term_id || is_correct === undefined || !mode || !firebase_uid) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(`[SIMPLE MODE] Processing update-level request:`, {
      term_id,
      is_correct,
      mode,
      firebase_uid: firebase_uid.substring(0, 5) + '...' // Hiển thị một phần của UID để bảo mật
    });

    // Lấy thông tin term hiện tại
    const [terms] = await db.query<Term[]>(
      'SELECT * FROM terms WHERE id = ? AND firebase_uid = ?', 
      [term_id, firebase_uid]
    );
    
    if (!Array.isArray(terms) || terms.length === 0) {
      return res.status(404).json({ error: 'Term not found' });
    }
    
    const term = terms[0];
    console.log(`Found term:`, {
      id: term.id,
      vocab: term.vocab,
      meaning: term.meaning,
      level_en: term.level_en,
      level_vi: term.level_vi
    });
    
    // CÁCH TIẾP CẬN ĐƠN GIẢN: Chỉ cập nhật một field duy nhất dựa vào mode
    if (mode === 'en_to_vi') {
      // Học tiếng Việt (Anh → Việt): CHỈ cập nhật level_vi
      const currentLevelVi = term.level_vi || 0;
      let newLevelVi;
      
      if (is_correct) {
        newLevelVi = Math.min(currentLevelVi + 1, 10);
      } else {
        newLevelVi = 1;
      }
      
      const nextReviewTimestampVi = calculateNextReviewTime(newLevelVi);
      
      console.log(`[SIMPLE] Updating ONLY level_vi: ${currentLevelVi} -> ${newLevelVi}`);
      
      // Chỉ cập nhật level_vi
      await db.query(
        `UPDATE terms SET level_vi = ?, review_time_vi = ? WHERE id = ? AND firebase_uid = ?`,
        [newLevelVi, nextReviewTimestampVi, term_id, firebase_uid]
      );
      
      // Đọc lại dữ liệu
      const [updatedTerms] = await db.query<Term[]>(
        'SELECT * FROM terms WHERE id = ? AND firebase_uid = ?', 
        [term_id, firebase_uid]
      );
      
      if (!Array.isArray(updatedTerms) || updatedTerms.length === 0) {
        return res.status(404).json({ error: 'Term not found after update' });
      }
      
      const updatedTerm = updatedTerms[0];
      
      // Tính ngày ôn tập tiếp theo
      const nextReviewDateVi = new Date(Number(updatedTerm.review_time_vi));
      const formattedDateVi = nextReviewDateVi.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return res.status(200).json({ 
        success: true,
        term_id,
        new_level_en: updatedTerm.level_en,
        new_level_vi: updatedTerm.level_vi,
        mode,
        field_updated: 'level_vi',
        next_review_time_vi: updatedTerm.review_time_vi,
        next_review_date_vi: formattedDateVi
      });
      
    } else {
      // Học tiếng Anh (Việt → Anh): CHỈ cập nhật level_en
      const currentLevelEn = term.level_en || 0;
      let newLevelEn;
      
      if (is_correct) {
        newLevelEn = Math.min(currentLevelEn + 1, 10);
      } else {
        newLevelEn = 1;
      }
      
      const nextReviewTimestampEn = calculateNextReviewTime(newLevelEn);
      
      console.log(`[SIMPLE] Updating ONLY level_en: ${currentLevelEn} -> ${newLevelEn}`);
      
      // Chỉ cập nhật level_en
      await db.query(
        `UPDATE terms SET level_en = ?, review_time_en = ? WHERE id = ? AND firebase_uid = ?`,
        [newLevelEn, nextReviewTimestampEn, term_id, firebase_uid]
      );
      
      // Đọc lại dữ liệu
      const [updatedTerms] = await db.query<Term[]>(
        'SELECT * FROM terms WHERE id = ? AND firebase_uid = ?', 
        [term_id, firebase_uid]
      );
      
      if (!Array.isArray(updatedTerms) || updatedTerms.length === 0) {
        return res.status(404).json({ error: 'Term not found after update' });
      }
      
      const updatedTerm = updatedTerms[0];
      
      // Tính ngày ôn tập tiếp theo
      const nextReviewDateEn = new Date(Number(updatedTerm.review_time_en));
      const formattedDateEn = nextReviewDateEn.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return res.status(200).json({ 
        success: true,
        term_id,
        new_level_en: updatedTerm.level_en,
        new_level_vi: updatedTerm.level_vi,
        mode,
        field_updated: 'level_en',
        next_review_time_en: updatedTerm.review_time_en,
        next_review_date_en: formattedDateEn
      });
    }
  } catch (error) {
    console.error('Error updating term level:', error);
    return res.status(500).json({ error: 'Failed to update term level' });
  }
} 