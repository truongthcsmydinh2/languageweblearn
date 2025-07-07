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
      let query = 'SELECT * FROM terms';
      const params = [];
      
      // Nếu có firebase_uid, chỉ lấy từ vựng của người dùng đó
      if (firebase_uid) {
        query += ' WHERE firebase_uid = ?';
        params.push(firebase_uid);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const [rows] = await db.execute(query, params);
      
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
        
        return {
          ...row,
          english: row.vocab,
          vietnamese: meanings.length > 0 ? meanings[0] : '',
          meanings: meanings,
          review_time_en: reviewTimeEn,
          review_time_vi: reviewTimeVi,
          last_review_en: lastReviewEn,
          last_review_vi: lastReviewVi
        };
      }) : [];
      
      return res.status(200).json(enhancedRows);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch vocab terms' });
    }
  }

  // Thêm một từ vựng mới
  if (method === 'POST') {
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
      const now = Date.now();
      const [result] = await db.query(
        `INSERT INTO terms (
           vocab, meanings, example_sentence, notes, 
           level_en, level_vi, review_time_en, review_time_vi, 
           last_review_en, last_review_vi,
           firebase_uid, part_of_speech, created_at, updated_at
         ) 
         VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          vocab,
          JSON.stringify([meaning]),
          example || null,
          notes || null,
          now, // review_time_en - thời gian review tiếp theo
          now, // review_time_vi - thời gian review tiếp theo
          now, // last_review_en - thời gian review cuối
          now, // last_review_vi - thời gian review cuối
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
      res.status(500).json({ error: 'Failed to add/update term' });
    }
  }

  // Xóa một từ vựng
  if (method === 'DELETE') {
    const { vocab, id } = body;
    
    if (!vocab && !id) {
      return res.status(400).json({ error: 'Vocab or ID is required' });
    }

    try {
      let query, params;
      
      if (id) {
        query = 'DELETE FROM terms WHERE id = ? AND firebase_uid = ?';
        params = [id, firebase_uid];
      } else {
        query = 'DELETE FROM terms WHERE vocab = ? AND firebase_uid = ?';
        params = [vocab, firebase_uid];
      }
      
      const [result] = await db.execute(query, params);
      
      return res.status(200).json({ 
        success: true, 
        message: `Đã xóa từ vựng ${id ? `ID ${id}` : `"${vocab}"`}` 
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete term' });
    }
  }

  // Cập nhật một từ vựng
  if (method === 'PUT') {
    const { id, vocab, meaning, example, notes, part_of_speech, level_en, level_vi } = body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }
    
    try {
      const [result] = await db.execute(
        `UPDATE terms 
         SET vocab = COALESCE(?, vocab),
             meanings = COALESCE(?, meanings),
             example_sentence = COALESCE(?, example_sentence),
             notes = COALESCE(?, notes),
             part_of_speech = COALESCE(?, part_of_speech),
             level_en = COALESCE(?, level_en),
             level_vi = COALESCE(?, level_vi),
             updated_at = NOW()
         WHERE id = ? AND firebase_uid = ?`,
        [
          vocab || null,
          meaning ? JSON.stringify([meaning]) : null,
          example || null,
          notes || null,
          part_of_speech || null,
          level_en || null,
          level_vi || null,
          id,
          firebase_uid
        ]
      );
      
      return res.status(200).json({ 
        success: true, 
        message: `Đã cập nhật từ vựng ID ${id}` 
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update term' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 