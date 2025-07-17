import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { userId, lessonId, answers, correctCount, total, duration } = req.body;
    if (!userId || !lessonId || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    // Tạo bảng nếu chưa có
    await db.execute(`CREATE TABLE IF NOT EXISTS dictation_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      lesson_id VARCHAR(64) NOT NULL,
      answers TEXT,
      correct_count INT,
      total INT,
      duration INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    // Lưu tiến trình (ghi đè nếu đã có)
    await db.execute(
      `REPLACE INTO dictation_progress (user_id, lesson_id, answers, correct_count, total, duration, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, lessonId, JSON.stringify(answers), correctCount, total, duration]
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: String(error) });
  }
} 