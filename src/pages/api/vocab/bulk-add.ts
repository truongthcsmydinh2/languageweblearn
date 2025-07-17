import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

// Định nghĩa kiểu dữ liệu cho một 'term' để code rõ ràng hơn
interface Term {
  vocab: string;
  meaning: string;
  part_of_speech?: string;
  level_en?: number;
  level_vi?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { terms }: { terms: Term[] } = req.body;
  const firebase_uid = req.headers.firebase_uid as string;
  
  console.log(`Bulk add API called with ${terms?.length || 0} terms for user ${firebase_uid}`);
  
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized - Missing firebase_uid' });
  }

  if (!terms || !Array.isArray(terms) || terms.length === 0) {
    return res.status(400).json({ error: 'Valid terms array is required' });
  }

  try {
    const validTerms = terms.filter(term => 
      term.vocab && term.vocab.trim() && term.meaning && term.meaning.trim()
    );
    
    console.log(`Found ${validTerms.length} valid terms out of ${terms.length} total.`);
    
    if (validTerms.length === 0) {
      return res.status(400).json({ error: 'No valid terms found to process' });
    }
    
    let addedCount = 0;
    let duplicateCount = 0;
    const skippedDuplicates: any[] = [];
    
    // Lấy tất cả các từ đã có của người dùng trong một lần truy vấn để tối ưu
    const [existingVocabsResult] = await db.execute(
      'SELECT LOWER(vocab) as vocab FROM terms WHERE firebase_uid = ?',
      [firebase_uid]
    );
    const existingVocabs = new Set((existingVocabsResult as any[]).map(row => row.vocab));

    for (const term of validTerms) {
      const vocabLower = term.vocab.trim().toLowerCase();
      
      // Kiểm tra trùng lặp bằng Set đã lấy trước đó (nhanh hơn nhiều)
      if (existingVocabs.has(vocabLower)) {
        console.log(`Duplicate vocab found for "${term.vocab}" - skipping.`);
        duplicateCount++;
        skippedDuplicates.push({
          vocab: term.vocab,
          reason: 'Term already exists'
        });
        continue; // Bỏ qua và xử lý từ tiếp theo
      }

      try {
        const currentTime = Date.now();
        const meaningsArray = [term.meaning.trim()];
        
        await db.execute(
          'INSERT INTO terms (vocab, meanings, level_en, level_vi, review_time_en, review_time_vi, firebase_uid, part_of_speech, status_learning_en, status_learning_vi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)',
          [
            term.vocab.trim(),
            JSON.stringify(meaningsArray), // Đúng cho cột JSON
            term.level_en || 0,
            term.level_vi || 0,
            currentTime, // Đúng cho cột bigint
            currentTime, // Đúng cho cột bigint
            firebase_uid,
            term.part_of_speech || null
          ]
        );
        
        addedCount++;
        // Thêm từ vừa thêm vào Set để tránh trường hợp người dùng gửi 2 từ giống nhau trong cùng 1 request
        existingVocabs.add(vocabLower); 

      } catch (dbError: any) {
        console.error(`Database error when adding term "${term.vocab}":`, dbError);
        
        duplicateCount++;
        skippedDuplicates.push({
          vocab: term.vocab,
          reason: 'database_error',
          error: dbError.message
        });
      }
    }
    
    console.log(`Bulk add completed: ${addedCount} added, ${duplicateCount} skipped.`);
    
    return res.status(201).json({ 
      success: true, 
      totalProcessed: validTerms.length,
      added: addedCount,
      duplicates: duplicateCount,
      skippedDetails: skippedDuplicates
    });

  } catch (error) {
    console.error('Critical error in bulk add handler:', error);
    return res.status(500).json({ 
      error: 'Failed to process vocab terms',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}