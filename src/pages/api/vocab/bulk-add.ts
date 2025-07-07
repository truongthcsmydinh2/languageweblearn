import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { terms } = req.body;
  const firebase_uid = req.headers.firebase_uid as string;
  
  console.log(`Bulk add API called with ${terms?.length || 0} terms`);
  console.log(`Headers:`, req.headers);
  
  if (!firebase_uid) {
    console.error('Unauthorized bulk add attempt - missing firebase_uid');
    return res.status(401).json({ error: 'Unauthorized - Missing firebase_uid' });
  }

  if (!terms || !Array.isArray(terms) || terms.length === 0) {
    return res.status(400).json({ error: 'Valid terms array is required' });
  }

  try {
    // Lọc và chỉ giữ lại các từ hợp lệ
    const validTerms = terms.filter(term => 
      term.vocab && term.vocab.trim() && term.meaning && term.meaning.trim()
    );
    
    console.log(`Found ${validTerms.length} valid terms out of ${terms.length} total`);
    
    if (validTerms.length === 0) {
      return res.status(400).json({ error: 'No valid terms found' });
    }
    
    let addedCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;
    let skippedDuplicates = [];
    let modifiedTerms = []; // Từ vựng đã được sửa đổi để tránh trùng lặp
    
    // Xử lý từng từ một
    for (const term of validTerms) {
      console.log(`Processing term: ${term.vocab}`);
      
      try {
        // Kiểm tra xem từ đã tồn tại chưa (chỉ kiểm tra vocab, không kiểm tra meanings)
        const [existingTerms] = await db.execute(
          'SELECT id, vocab, meanings FROM terms WHERE firebase_uid = ? AND LOWER(vocab) = LOWER(?)',
          [firebase_uid, term.vocab.trim()]
        );
        
        const currentTime = Date.now();
        
        // Chỉ báo lỗi khi trùng vocab
        if (Array.isArray(existingTerms) && existingTerms.length > 0) {
          // Ghi nhận từ trùng lặp và bỏ qua
          duplicateCount++;
          skippedDuplicates.push({
            vocab: term.vocab,
            meaning: term.meaning,
            duplicateId: (existingTerms[0] as any).id,
            reason: 'vocab_duplicate'
          });
          console.log(`Duplicate vocab found for "${term.vocab}" - skipping`);
          continue; // Bỏ qua từ này, xử lý từ tiếp theo
        }
        
        // Thêm mới từ vựng
        try {
          // Chuyển meaning thành JSON array
          const meaningsArray = [term.meaning.trim()];
          
          await db.execute(
            'INSERT INTO terms (vocab, meanings, level_en, level_vi, review_time_en, review_time_vi, firebase_uid, part_of_speech) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              term.vocab.trim(),
              JSON.stringify(meaningsArray),
              term.level_en || 0,
              term.level_vi || 0,
              term.review_time_en || currentTime,
              term.review_time_vi || currentTime,
              firebase_uid,
              term.part_of_speech || null
            ]
          );
          addedCount++;
          console.log(`Successfully added term: ${term.vocab}`);
        } catch (dbError: any) {
          console.error(`Database error when adding term "${term.vocab}":`, dbError);
          
          // Xử lý lỗi trùng lặp từ cơ sở dữ liệu
          if (dbError.code === 'ER_DUP_ENTRY' && dbError.sqlMessage.includes('idx_vocab')) {
            console.log(`Duplicate vocab error for "${term.vocab}". Trying with modified vocab...`);
            
            // Tạo một phiên bản mới của từ vựng với hậu tố để tránh trùng lặp
            const modifiedVocab = `${term.vocab}_${Date.now().toString().slice(-4)}`;
            
            try {
              // Thử lại với từ vựng đã sửa đổi
              const meaningsArray = [term.meaning.trim()];
              
              await db.execute(
                'INSERT INTO terms (vocab, meanings, level_en, level_vi, review_time_en, review_time_vi, firebase_uid, part_of_speech) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  modifiedVocab,
                  JSON.stringify(meaningsArray),
                  term.level_en || 0,
                  term.level_vi || 0,
                  term.review_time_en || currentTime,
                  term.review_time_vi || currentTime,
                  firebase_uid,
                  term.part_of_speech || null
                ]
              );
              
              addedCount++;
              modifiedTerms.push({
                originalVocab: term.vocab,
                modifiedVocab: modifiedVocab,
                meaning: term.meaning
              });
              
              console.log(`Term added successfully with modified vocab: ${modifiedVocab}`);
            } catch (modifiedError) {
              console.error(`Error adding term with modified vocab "${modifiedVocab}":`, modifiedError);
              
              // Nếu vẫn không thể thêm, ghi nhận và bỏ qua
              duplicateCount++;
              skippedDuplicates.push({
                vocab: term.vocab,
                meaning: term.meaning,
                reason: 'vocab_duplicate',
                error: 'Could not add even with modified vocab'
              });
            }
          } else {
            // Nếu là lỗi khác, ghi nhận và bỏ qua
            duplicateCount++;
            skippedDuplicates.push({
              vocab: term.vocab,
              meaning: term.meaning,
              reason: 'database_error',
              error: dbError.message
            });
          }
        }
      } catch (error) {
        console.error(`Error processing term "${term.vocab}":`, error);
        duplicateCount++;
        skippedDuplicates.push({
          vocab: term.vocab,
          meaning: term.meaning,
          reason: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    console.log(`Bulk add completed: ${addedCount} added, ${duplicateCount} duplicates skipped`);
    
    // Trả về số liệu chính xác
    return res.status(201).json({ 
      success: true, 
      total: validTerms.length,
      added: addedCount,
      duplicates: duplicateCount,
      skippedDuplicates: skippedDuplicates,
      modifiedTerms: modifiedTerms
    });
  } catch (error) {
    console.error('Error adding multiple vocab terms:', error);
    return res.status(500).json({ 
      error: 'Failed to add vocab terms',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 