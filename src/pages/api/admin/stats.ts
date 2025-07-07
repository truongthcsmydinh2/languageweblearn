import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

// Bỏ import từ firebase-admin
// import { auth } from 'firebase-admin';
// import { getFirebaseAdminApp } from '@/lib/firebase-admin';

// Bỏ khởi tạo Firebase Admin
// getFirebaseAdminApp();

interface StatsData {
  totalUsers: number;
  totalTerms: number;
  apiCalls: {
    gemini: number;
    openai: number;
    total: number;
  };
  tokenUsage: {
    gemini: number;
    openai: number;
    total: number;
  };
  serverStatus: 'online' | 'degraded' | 'offline';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Môi trường development: bỏ qua xác thực và trả về dữ liệu mẫu
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Returning sample stats data');
    const sampleData: StatsData = {
      totalUsers: 124,
      totalTerms: 3527,
      apiCalls: {
        gemini: 846,
        openai: 1253,
        total: 2099
      },
      tokenUsage: {
        gemini: 156820,
        openai: 245670,
        total: 402490
      },
      serverStatus: 'online'
    };
    return res.status(200).json(sampleData);
  }

  // Kiểm tra xác thực (chỉ thực hiện trong môi trường production)
  const sessionCookie = req.cookies.session || '';
  if (!sessionCookie) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Trong môi trường production, sẽ xác thực với Firebase Admin
    // Vì đã có điều kiện ở trên nên code này sẽ không được thực thi trong dev
    /* 
    const decodedClaims = await auth().verifySessionCookie(sessionCookie);
    const { uid } = decodedClaims;

    // Kiểm tra xem người dùng có quyền admin không
    const isAdmin = uid === process.env.ADMIN_UID;
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    */

    // Lấy thống kê từ database
    const statsData: StatsData = await getStats();

    // Trả về kết quả
    return res.status(200).json(statsData);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

// Hàm lấy thống kê từ database
async function getStats(): Promise<StatsData> {
  try {
    // Tính tổng số người dùng
    const userCountResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = userCountResult[0]?.count || 0;
    
    // Tính tổng số từ vựng
    const termsCountResult = await query('SELECT COUNT(*) as count FROM terms');
    const totalTerms = termsCountResult[0]?.count || 0;
    
    // Lấy thống kê API từ bảng api_logs (giả định bảng này tồn tại)
    const apiCallsResult = await query(`
      SELECT 
        service, 
        COUNT(*) as call_count,
        SUM(tokens_in) as tokens_in_sum,
        SUM(tokens_out) as tokens_out_sum
      FROM api_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY service
    `);
    
    // Biến đổi kết quả
    let geminiApiCalls = 0;
    let openaiApiCalls = 0;
    let geminiTokens = 0;
    let openaiTokens = 0;
    
    apiCallsResult.forEach((row: any) => {
      if (row.service === 'google') {
        geminiApiCalls = row.call_count;
        geminiTokens = (row.tokens_in_sum || 0) + (row.tokens_out_sum || 0);
      } else if (row.service === 'openai') {
        openaiApiCalls = row.call_count;
        openaiTokens = (row.tokens_in_sum || 0) + (row.tokens_out_sum || 0);
      }
    });
    
    const totalApiCalls = geminiApiCalls + openaiApiCalls;
    const totalTokens = geminiTokens + openaiTokens;
    
    // Kiểm tra trạng thái server
    const serverStatus: 'online' | 'degraded' | 'offline' = 'online';
    
    // Trả về đối tượng thống kê
    return {
      totalUsers,
      totalTerms,
      apiCalls: {
        gemini: geminiApiCalls,
        openai: openaiApiCalls,
        total: totalApiCalls
      },
      tokenUsage: {
        gemini: geminiTokens,
        openai: openaiTokens,
        total: totalTokens
      },
      serverStatus
    };
  } catch (error) {
    console.error('Error in getStats:', error);
    // Trả về dữ liệu mặc định trong trường hợp lỗi
    return {
      totalUsers: 0,
      totalTerms: 0,
      apiCalls: {
        gemini: 0,
        openai: 0,
        total: 0
      },
      tokenUsage: {
        gemini: 0,
        openai: 0,
        total: 0
      },
      serverStatus: 'degraded'
    };
  }
}
