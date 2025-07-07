import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

interface StatsResult extends RowDataPacket {
  count: number;
}

interface ActivityResult extends RowDataPacket {
  date: string;
  count: number;
}

interface LevelStatsResult extends RowDataPacket {
  level: number;
  count: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;

  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized - Missing firebase_uid' });
  }

  try {
    // Lấy tổng số từ vựng
    const [totalResult] = await db.query<StatsResult[]>(
      'SELECT COUNT(*) as count FROM terms WHERE firebase_uid = ?',
      [firebase_uid]
    );
    const totalTerms = Array.isArray(totalResult) && totalResult.length > 0 
      ? totalResult[0].count 
      : 0;

    // Lấy số từ cần ôn tập hôm nay (dựa trên review_time_en hoặc review_time_vi)
    const now = new Date();
    const [reviewResult] = await db.query<StatsResult[]>(
      'SELECT COUNT(*) as count FROM terms WHERE (review_time_en < ? OR review_time_vi < ?) AND firebase_uid = ?',
      [now.getTime(), now.getTime(), firebase_uid]
    );
    const termsToReview = Array.isArray(reviewResult) && reviewResult.length > 0 
      ? reviewResult[0].count 
      : 0;

    // Lấy số từ đã học (level_en > 0 hoặc level_vi > 0)
    const [learnedResult] = await db.query<StatsResult[]>(
      'SELECT COUNT(*) as count FROM terms WHERE (level_en > 0 OR level_vi > 0) AND firebase_uid = ?',
      [firebase_uid]
    );
    const learnedTerms = Array.isArray(learnedResult) && learnedResult.length > 0 
      ? learnedResult[0].count 
      : 0;

    // Lấy số từ đã thành thạo (level_en >= 5 hoặc level_vi >= 5)
    const [masteredResult] = await db.query<StatsResult[]>(
      'SELECT COUNT(*) as count FROM terms WHERE (level_en >= 5 OR level_vi >= 5) AND firebase_uid = ?',
      [firebase_uid]
    );
    const masteredTerms = Array.isArray(masteredResult) && masteredResult.length > 0 
      ? masteredResult[0].count 
      : 0;

    // Lấy số từ mới trong 7 ngày qua
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [recentTermsResult] = await db.query<StatsResult[]>(
      'SELECT COUNT(*) as count FROM terms WHERE created_at > ? AND firebase_uid = ?',
      [sevenDaysAgo, firebase_uid]
    );
    const recentTerms = Array.isArray(recentTermsResult) && recentTermsResult.length > 0 
      ? recentTermsResult[0].count 
      : 0;

    // Lấy thống kê theo cấp độ (sử dụng level_en)
    const [levelStatsResult] = await db.query<LevelStatsResult[]>(
      'SELECT level_en as level, COUNT(*) as count FROM terms WHERE firebase_uid = ? GROUP BY level_en ORDER BY level_en',
      [firebase_uid]
    );
    const levelStats = Array.isArray(levelStatsResult) ? levelStatsResult : [];

    // Lấy thống kê theo cấp độ cho tiếng Việt
    const [levelStatsViResult] = await db.query<LevelStatsResult[]>(
      'SELECT level_vi as level, COUNT(*) as count FROM terms WHERE firebase_uid = ? GROUP BY level_vi ORDER BY level_vi',
      [firebase_uid]
    );
    const levelStatsVi = Array.isArray(levelStatsViResult) ? levelStatsViResult : [];

    // Lấy hoạt động thêm từ trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [dailyActivityResult] = await db.query<ActivityResult[]>(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as count 
      FROM terms 
      WHERE created_at > ? AND firebase_uid = ? 
      GROUP BY date 
      ORDER BY date ASC`,
      [thirtyDaysAgo, firebase_uid]
    );
    const dailyActivity = Array.isArray(dailyActivityResult) ? dailyActivityResult : [];

    return res.status(200).json({
      totalTerms,
      termsToReview,
      learnedTerms,
      masteredTerms,
      recentTerms,
      levelStats,
      levelStatsVi,
      dailyActivity
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
} 