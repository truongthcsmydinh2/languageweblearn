import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { termId, level_en, level_vi, reviewTime, mode } = req.body;
  const firebase_uid = req.headers.firebase_uid as string;
  
  if (!termId || !firebase_uid) {
    return res.status(400).json({ error: 'Term ID and firebase_uid are required' });
  }

  try {
    // Tính toán thời gian ôn tập tiếp theo dựa trên cấp độ hiện tại
    // Mỗi cấp độ sẽ có thời gian ôn tập khác nhau
    const newLevelEn = typeof level_en === 'number' ? level_en : undefined;
    const newLevelVi = typeof level_vi === 'number' ? level_vi : undefined;
    const newReviewTime = reviewTime || calculateNextReviewTime(Math.min(newLevelEn || 0, newLevelVi || 0));
    
    let query = 'UPDATE terms SET';
    const params = [];
    
    if (newLevelEn !== undefined) {
      query += ' level_en = ?,';
      params.push(newLevelEn);
    }
    
    if (newLevelVi !== undefined) {
      query += ' level_vi = ?,';
      params.push(newLevelVi);
    }
    
    // Cập nhật thời gian ôn tập dựa trên mode hoặc cả hai
    if (mode === 'en_to_vi') {
      query += ' review_time_en = ? WHERE id = ? AND firebase_uid = ?';
      params.push(newReviewTime, termId, firebase_uid);
    } else if (mode === 'vi_to_en') {
      query += ' review_time_vi = ? WHERE id = ? AND firebase_uid = ?';
      params.push(newReviewTime, termId, firebase_uid);
    } else {
      // Mặc định cập nhật cả hai
      query += ' review_time_en = ?, review_time_vi = ? WHERE id = ? AND firebase_uid = ?';
      params.push(newReviewTime, newReviewTime, termId, firebase_uid);
    }
    
    await db.execute(query, params);
    
    return res.status(200).json({ 
      success: true,
      level_en: newLevelEn,
      level_vi: newLevelVi,
      reviewTime: newReviewTime,
      mode
    });
  } catch (error) {
    console.error('Error updating review time:', error);
    return res.status(500).json({ error: 'Failed to update review time' });
  }
}

// Hàm tính toán thời gian ôn tập tiếp theo dựa trên cấp độ (sử dụng múi giờ Việt Nam)
function calculateNextReviewTime(level = 0) {
  const now = new Date();
  
  // Tạo ngày theo múi giờ Việt Nam (GMT+7)
  const vietnamDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  
  // Tạo Date object từ ngày Việt Nam
  const vietnamTime = new Date(vietnamDate + 'T00:00:00.000Z');
  let next = new Date(vietnamTime);
  
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
  
  // Tính toán ngày ôn tập tiếp theo
  next.setDate(vietnamTime.getDate() + interval);
  
  // Format lại theo múi giờ Việt Nam
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(next);
} 