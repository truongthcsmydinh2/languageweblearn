import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req;
  const firebase_uid = req.headers.firebase_uid as string;
  
  // Kiểm tra xác thực cho tất cả các phương thức trừ GET (cho phép GET không cần xác thực trong giai đoạn chuyển tiếp)
  if (method !== 'GET' && !firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized - Missing firebase_uid' });
  }

  // Lấy tất cả các từ vựng
  if (method === 'GET') {
    try {
      // Lấy limit và offset từ query
      const limit = parseInt((req.query.limit as string) || '25', 10);
      const offset = parseInt((req.query.offset as string) || '0', 10);
      // Lấy tham số tìm kiếm
      const search = (req.query.search as string)?.trim();
      // Thêm tham số min_level
      const minLevelQuery = req.query.min_level ? parseInt(req.query.min_level as string, 10) : null;
      let query = 'SELECT *, LEAST(level_en, level_vi) AS min_level FROM terms';
      const params = [];
      const whereConds = [];
      // Nếu có firebase_uid, chỉ lấy từ vựng của người dùng đó
      if (firebase_uid) {
        whereConds.push('firebase_uid = ?');
        params.push(firebase_uid);
      }
      // Nếu có search, thêm điều kiện tìm kiếm
      if (search) {
        whereConds.push('(vocab LIKE ? OR meanings LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      // Nếu có min_level, lọc theo min_level
      if (minLevelQuery !== null && !isNaN(minLevelQuery)) {
        whereConds.push('LEAST(level_en, level_vi) <= ?');
        params.push(minLevelQuery);
      }
      if (whereConds.length > 0) {
        query += ' WHERE ' + whereConds.join(' AND ');
      }
      // Sắp xếp theo min_level tăng dần, rồi đến created_at
      query += ` ORDER BY min_level ASC, created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      const [rows] = await db.execute(query, params);
      
      // Đếm tổng số từ (áp dụng cùng điều kiện)
      let countQuery = 'SELECT COUNT(*) as total FROM terms';
      const countParams = [];
      const countConds = [];
      if (firebase_uid) {
        countConds.push('firebase_uid = ?');
        countParams.push(firebase_uid);
      }
      if (search) {
        countConds.push('(vocab LIKE ? OR meanings LIKE ?)');
        countParams.push(`%${search}%`, `%${search}%`);
      }
      if (minLevelQuery !== null && !isNaN(minLevelQuery)) {
        countConds.push('LEAST(level_en, level_vi) <= ?');
        countParams.push(minLevelQuery);
      }
      if (countConds.length > 0) {
        countQuery += ' WHERE ' + countConds.join(' AND ');
      }
      const [countRows] = await db.execute(countQuery, countParams);
      const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows as any[])[0].total : 0;
      
      // Thêm các trường english và vietnamese cho tương thích với UI
      const enhancedRows = Array.isArray(rows) ? rows.map((row: any) => {
        let meanings = [];
        try {
          // MySQL trả về JSON dưới dạng string, cần parse
          if (row.meanings) {
            if (typeof row.meanings === 'string') {
              meanings = JSON.parse(row.meanings);
            } else {
              meanings = row.meanings;
            }
          }
          if (!Array.isArray(meanings)) meanings = [];
        } catch (e) {
          meanings = [];
        }
        
        // Xử lý thời gian review - nếu là 0 thì trả về null
        const reviewTimeEn = row.review_time_en && row.review_time_en > 0 ? row.review_time_en : null;
        const reviewTimeVi = row.review_time_vi && row.review_time_vi > 0 ? row.review_time_vi : null;
        const lastReviewEn = row.last_review_en && row.last_review_en > 0 ? row.last_review_en : null;
        const lastReviewVi = row.last_review_vi && row.last_review_vi > 0 ? row.last_review_vi : null;
        
        // min_level đã có từ SQL
        const min_level = row.min_level;
        
        return {
          ...row,
          english: row.vocab,
          vietnamese: meanings.length > 0 ? meanings[0] : '',
          meanings: meanings,
          review_time_en: reviewTimeEn,
          review_time_vi: reviewTimeVi,
          last_review_en: lastReviewEn,
          last_review_vi: lastReviewVi,
          min_level
        };
      }) : [];
      
      return res.status(200).json({ total, data: enhancedRows });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách từ vựng:', error);
      return res.status(500).json({ error: 'Failed to fetch vocab terms' });
    }
  }

  // Thêm một từ vựng mới
  if (method === 'POST') {
    console.log('📥 POST /api/vocab body:', body);
    // Xử lý cả hai trường hợp: { vocab, meaning, ... } và { term: { vocab, meaning, ... } }
    const data = body.term || body;
    const { vocab, meaning, example, notes, set_id, timeAdded, part_of_speech } = data;
    
    if (!vocab || !meaning) {
      return res.status(400).json({ error: 'Vocab and meaning are required' });
    }
    
    try {
      // Kiểm tra xem từ đã tồn tại chưa
      const [existingTerms] = await db.execute(
        'SELECT id, vocab, meanings, part_of_speech FROM terms WHERE firebase_uid = ? AND LOWER(vocab) = LOWER(?)',
        [firebase_uid, vocab.trim()]
      );
      
      if (Array.isArray(existingTerms) && existingTerms.length > 0) {
        const existingTerm = existingTerms[0] as any;
        let meanings = [];
        
        try {
          // Parse meanings từ JSON, nếu có
          if (existingTerm.meanings) {
            if (typeof existingTerm.meanings === 'string') {
              meanings = JSON.parse(existingTerm.meanings);
            } else {
              meanings = existingTerm.meanings;
            }
          }
          if (!Array.isArray(meanings)) meanings = [];
        } catch (e) {
          meanings = [];
        }
        
        // Thêm nghĩa mới nếu chưa tồn tại
        if (!meanings.includes(meaning.trim())) {
          meanings.push(meaning.trim());
          
          // Cập nhật từ với nghĩa mới và part_of_speech nếu có
          await db.execute(
            `UPDATE terms 
             SET meanings = ?,
                 example_sentence = COALESCE(?, example_sentence),
                 notes = COALESCE(?, notes),
                 part_of_speech = COALESCE(?, part_of_speech),
                 updated_at = NOW()
             WHERE id = ?`,
            [
              JSON.stringify(meanings),
              example || null,
              notes || null,
              part_of_speech || null,
              existingTerm.id
            ]
          );
          
          return res.status(200).json({ 
            success: true, 
            id: existingTerm.id,
            message: `Đã thêm nghĩa mới "${meaning}" cho từ "${vocab}". Các nghĩa hiện tại: ${meanings.join(', ')}`,
            meanings: meanings,
            part_of_speech: part_of_speech || existingTerm.part_of_speech
          });
        } else {
          // Nghĩa đã tồn tại
          return res.status(409).json({ 
            error: 'Duplicate meaning', 
            message: `Nghĩa "${meaning}" đã tồn tại cho từ "${vocab}". Các nghĩa hiện tại: ${meanings.join(', ')}`,
            duplicateId: existingTerm.id,
            isDuplicate: true,
            meanings: meanings,
            part_of_speech: existingTerm.part_of_speech
          });
        }
      }
      
      // Nếu từ chưa tồn tại, thêm mới với thời gian review hợp lệ
      function toMySQLDateOnly(ts: number) {
        return new Date(ts).toISOString().slice(0, 10); // chỉ lấy yyyy-mm-dd
      }
      const now = Date.now();
      // const reviewDate = toMySQLDateOnly(now); // Không dùng nữa
      const [result] = await db.query(
        `INSERT INTO terms (
           vocab, meanings, example_sentence, notes, 
           level_en, level_vi, review_time_en, review_time_vi, 
           last_review_en, last_review_vi,
           firebase_uid, part_of_speech, created_at, updated_at,
           status_learning_en, status_learning_vi
         ) 
         VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL, NULL)`,
        [
          vocab,
          JSON.stringify([meaning]),
          example || null,
          notes || null,
          now, // review_time_en (BIGINT)
          now, // review_time_vi (BIGINT)
          now,        // last_review_en (BIGINT)
          now,        // last_review_vi (BIGINT)
          firebase_uid,
          part_of_speech || null
        ]
      );
      
      res.status(200).json({ 
        success: true, 
        id: (result as any).insertId,
        message: `Đã thêm từ "${vocab}" với nghĩa "${meaning}"`,
        meanings: [meaning],
        part_of_speech: part_of_speech,
        review_time_en: now,
        review_time_vi: now,
        last_review_en: now,
        last_review_vi: now
      });
    } catch (error) {
      console.error('❌ Lỗi khi thêm từ vựng:', error);
      return res.status(500).json({ error: 'Internal server error', detail: error instanceof Error ? error.message : error });
    }
  }
}