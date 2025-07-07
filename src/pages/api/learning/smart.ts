import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

// Định nghĩa interface cho Term
interface Term extends RowDataPacket {
  id: number;
  vocab: string;
  meaning: string;
  level_en?: number;
  level_vi?: number;
  level?: number; // Trường legacy có thể tồn tại
  review_time_en?: Date | string | number;
  review_time_vi?: Date | string | number;
  review_time?: Date | string | number; // Trường legacy có thể tồn tại
  time_added: number;
  firebase_uid: string;
  [key: string]: any; // Cho phép các trường khác
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Kiểm tra firebase_uid từ nhiều nguồn có thể
  let firebase_uid: string | undefined;
  
  // Kiểm tra trong header (chuẩn hóa tên header)
  const headerKeys = Object.keys(req.headers).map(k => k.toLowerCase());
  
  if (req.headers.firebase_uid) {
    firebase_uid = req.headers.firebase_uid as string;
  } else if (req.headers['firebase-uid']) {
    firebase_uid = req.headers['firebase-uid'] as string;
  } else if (req.headers['x-firebase-uid']) {
    firebase_uid = req.headers['x-firebase-uid'] as string;
  }
  
  // Kiểm tra trong query params
  if (!firebase_uid && req.query.firebase_uid) {
    firebase_uid = req.query.firebase_uid as string;
  }
  
  // Kiểm tra trong cookies
  if (!firebase_uid && req.cookies.firebase_uid) {
    firebase_uid = req.cookies.firebase_uid;
  }

  try {
    if (!firebase_uid) {
      return res.status(401).json({ 
        error: 'Unauthorized - Missing firebase_uid',
        headers: req.headers,
        message: 'Please ensure firebase_uid is included in the request headers'
      });
    }
    
    // Lấy thời gian hiện tại
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTimestamp = today.getTime();
    
    // Lấy mode từ query hoặc header (ưu tiên query)
    let mode = req.query.mode as string | undefined;
    if (!mode && req.headers.mode) mode = req.headers.mode as string;
    if (!mode) mode = 'both'; // Mặc định
    
    // Truy vấn đơn giản hơn để lấy tất cả các từ của người dùng
    const allTermsQuery = `SELECT * FROM terms WHERE firebase_uid = ?`;
    
    const [allTerms] = await db.query<Term[]>(allTermsQuery, [firebase_uid]);
    
    // Kiểm tra xem có từ nào không
    if (allTerms.length === 0) {
      return res.status(200).json({ 
        terms: [],
        message: "No vocabulary terms found for this user"
      });
    }
    
    // Chuẩn hóa dữ liệu để đảm bảo tất cả các từ đều có level_en và level_vi
    const normalizedTerms = allTerms.map(term => {
      // Nếu không có level_en hoặc level_vi, sử dụng trường level nếu có
      const normalizedTerm = { ...term };
      
      if (normalizedTerm.level_en === undefined && normalizedTerm.level !== undefined) {
        normalizedTerm.level_en = normalizedTerm.level;
      }
      
      if (normalizedTerm.level_vi === undefined && normalizedTerm.level !== undefined) {
        normalizedTerm.level_vi = normalizedTerm.level;
      }
      
      // Đảm bảo level_en và level_vi có giá trị mặc định là 0 nếu không tồn tại
      normalizedTerm.level_en = normalizedTerm.level_en ?? 0;
      normalizedTerm.level_vi = normalizedTerm.level_vi ?? 0;
      
      // Tương tự với review_time
      if (normalizedTerm.review_time_en === undefined && normalizedTerm.review_time !== undefined) {
        normalizedTerm.review_time_en = normalizedTerm.review_time;
      }
      
      if (normalizedTerm.review_time_vi === undefined && normalizedTerm.review_time !== undefined) {
        normalizedTerm.review_time_vi = normalizedTerm.review_time;
      }
      
      return normalizedTerm;
    });
    
    // Lọc từ mới đúng theo mode
    let newTerms: Term[] = [];
    if (mode === 'en_to_vi') {
      newTerms = normalizedTerms.filter(term => term.level_en === 0);
    } else if (mode === 'vi_to_en') {
      newTerms = normalizedTerms.filter(term => term.level_vi === 0);
    } else {
      newTerms = normalizedTerms.filter(term => term.level_en === 0 || term.level_vi === 0);
    }
    
    // Sắp xếp các từ mới theo thời gian thêm vào (mới nhất lên đầu)
    const sortedNewTerms = [...newTerms].sort((a, b) => b.time_added - a.time_added);
    
    if (sortedNewTerms.length === 0) {
      return res.status(200).json({ 
        terms: [],
        message: "No vocabulary terms due for review"
      });
    }
    
    return res.status(200).json({ 
      terms: sortedNewTerms,
      totalTerms: sortedNewTerms.length,
      newTerms: sortedNewTerms.length,
      reviewTerms: 0 // Không còn lấy các từ cần ôn tập nữa
    });
  } catch (error) {
    console.error('Error fetching learning terms:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch terms',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 