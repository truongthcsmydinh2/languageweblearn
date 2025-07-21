import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

// Hàm lấy ngày hiện tại theo múi giờ Việt Nam (GMT+7)
function getTodayStrGMT7() {
  const now = new Date();
  
  // Tạo ngày theo múi giờ Việt Nam (GMT+7)
  // Sử dụng Intl.DateTimeFormat để đảm bảo chính xác
  const vietnamDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  
  return vietnamDate; // Định dạng yyyy-mm-dd
}

// Hàm tìm ngày gần nhất có từ vựng cần học
async function findNextLearningDate(firebase_uid: string) {
  try {
    // Tìm ngày gần nhất có từ vựng cần học (review_time_en hoặc review_time_vi >= ngày hiện tại)
    const [futureTerms] = await db.query(
      `SELECT 
        MIN(LEAST(
          COALESCE(review_time_en, '9999-12-31'), 
          COALESCE(review_time_vi, '9999-12-31')
        )) as next_date,
        COUNT(*) as total_terms
      FROM terms 
      WHERE firebase_uid = ? 
      AND (
        (review_time_en >= CURDATE() AND level_en > 0) OR 
        (review_time_vi >= CURDATE() AND level_vi > 0)
      )`,
      [firebase_uid]
    );

    if (futureTerms && (futureTerms as any[]).length > 0 && (futureTerms as any[])[0].next_date !== '9999-12-31') {
      let nextDate = (futureTerms as any[])[0].next_date;
      
      // Chuyển đổi timestamp thành định dạng yyyy-mm-dd nếu cần
      if (typeof nextDate === 'number' || (typeof nextDate === 'string' && /^\d+$/.test(nextDate))) {
        const date = new Date(Number(nextDate));
        nextDate = date.toISOString().slice(0, 10);
      } else if (nextDate instanceof Date) {
        nextDate = nextDate.toISOString().slice(0, 10);
      } else if (typeof nextDate === 'string' && nextDate.length > 10) {
        nextDate = nextDate.slice(0, 10);
      }
      
      return {
        nextDate: nextDate,
        totalTerms: (futureTerms as any[])[0].total_terms
      };
    }

    // Nếu không có từ nào trong tương lai, tìm từ mới (level = 0)
    const [newTerms] = await db.query(
      `SELECT COUNT(*) as count
      FROM terms 
      WHERE firebase_uid = ? 
      AND (level_en = 0 OR level_vi = 0)`,
      [firebase_uid]
    );

    if (newTerms && (newTerms as any[]).length > 0 && (newTerms as any[])[0].count > 0) {
      return {
        nextDate: getTodayStrGMT7(), // Từ mới có thể học ngay hôm nay
        totalTerms: (newTerms as any[])[0].count,
        isNewTerms: true
      };
    }

    return null;
  } catch (error) {
    console.error('Error finding next learning date:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const firebase_uid = req.headers.firebase_uid as string;
  if (!firebase_uid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const mode = req.query.mode as string || 'both';
  const today = getTodayStrGMT7();
  
  console.log(`=== SMART LEARNING API DEBUG ===`);
  console.log(`Ngày hiện tại (GMT+7): ${today}`);
  console.log(`Mode: ${mode}`);
  console.log(`Server timezone offset: ${new Date().getTimezoneOffset()} minutes`);
  console.log(`Current UTC time: ${new Date().toISOString()}`);
  console.log(`=== END SMART LEARNING API DEBUG ===`);

  try {
    // Lấy tất cả các từ của người dùng
    const [terms] = await db.query(
      'SELECT * FROM terms WHERE firebase_uid = ?',
      [firebase_uid]
    );

    if (!terms || (terms as any[]).length === 0) {
      return res.status(200).json({ 
        learningList: [],
        message: 'Không có từ vựng nào' 
      });
    }

    console.log(`Tổng số từ vựng của người dùng: ${(terms as any[]).length}`);

    // Tạo danh sách lượt học
    const learningList = [];
    const termsToLearn: number[] = [];
    const detailedLog: any[] = [];

    // Duyệt qua từng từ và kiểm tra ngày ôn tập
    for (const term of terms as any[]) {
      // Log giá trị thực tế lấy từ database
      // Chuẩn hóa định dạng ngày từ DB để so sánh
      // Format của review_time_en/vi từ DB có thể là yyyy-mm-dd hoặc dạng Date object
      let reviewTimeEn = null;
      let reviewTimeVi = null;
      if (term.review_time_en) {
        if (typeof term.review_time_en === 'string') {
          reviewTimeEn = term.review_time_en.slice(0, 10);
        } else {
          // Nếu là Date object, cộng thêm 7 tiếng GMT+7 trước khi lấy ngày
          const date = new Date(term.review_time_en);
          date.setHours(date.getHours() + 7);
          reviewTimeEn = date.toISOString().slice(0, 10);
        }
      }
      if (term.review_time_vi) {
        if (typeof term.review_time_vi === 'string') {
          reviewTimeVi = term.review_time_vi.slice(0, 10);
        } else {
          const date = new Date(term.review_time_vi);
          date.setHours(date.getHours() + 7);
          reviewTimeVi = date.toISOString().slice(0, 10);
        }
      }
      
      const levelEn = term.level_en || 0;
      const levelVi = term.level_vi || 0;
      
      const logEntry = {
        id: term.id,
        vocab: term.vocab,
        levelEn,
        levelVi,
        reviewTimeEn,
        reviewTimeVi,
        matchesEnDate: reviewTimeEn === today,
        matchesViDate: reviewTimeVi === today,
        isNewEn: levelEn === 0,
        isNewVi: levelVi === 0
      };
      
      detailedLog.push(logEntry);

      // Kiểm tra chiều Anh -> Việt (dùng level_en và review_time_en)
      // Lấy từ có ngày ôn tập đúng bằng ngày hiện tại HOẶC là từ mới (level_en = 0)
      if ((mode === 'both' || mode === 'en_to_vi') && 
          (reviewTimeEn === today || levelEn === 0)) {
            learningList.push({
          term,
          mode: 'en_to_vi'
        });
        
        if (!termsToLearn.includes(term.id)) {
          termsToLearn.push(term.id);
        }
      }

      // Kiểm tra chiều Việt -> Anh (dùng level_vi và review_time_vi)
      // Lấy từ có ngày ôn tập đúng bằng ngày hiện tại HOẶC là từ mới (level_vi = 0)
      if ((mode === 'both' || mode === 'vi_to_en') && 
          (reviewTimeVi === today || levelVi === 0)) {
        learningList.push({
          term,
          mode: 'vi_to_en'
        });
        
        if (!termsToLearn.includes(term.id)) {
          termsToLearn.push(term.id);
        }
      }
    }



    // Nếu không có từ nào cần học hôm nay, tìm ngày gần nhất
    if (learningList.length === 0) {
      const nextLearningInfo = await findNextLearningDate(firebase_uid);
      if (nextLearningInfo) {
        // Thêm log chi tiết cho ngày gần nhất có ôn tập
        console.log('--- Ngày gần nhất có ôn tập ---');
        console.log('Ngày:', nextLearningInfo.nextDate);
        console.log('Số từ:', nextLearningInfo.totalTerms);
        // Đảm bảo nextDate ở định dạng yyyy-mm-dd
        let formattedNextDate = nextLearningInfo.nextDate;
        if (typeof formattedNextDate === 'number' || (typeof formattedNextDate === 'string' && /^\d+$/.test(formattedNextDate))) {
          const date = new Date(Number(formattedNextDate));
          formattedNextDate = date.toISOString().slice(0, 10);
        } else if (formattedNextDate instanceof Date) {
          formattedNextDate = formattedNextDate.toISOString().slice(0, 10);
        } else if (typeof formattedNextDate === 'string' && formattedNextDate.length > 10) {
          formattedNextDate = formattedNextDate.slice(0, 10);
        }
        
        // Lấy chi tiết các từ và chiều của ngày gần nhất
        const [termsNext] = await db.query(
          `SELECT * FROM terms WHERE firebase_uid = ? AND ((DATE(review_time_en) = ? AND level_en > 0) OR (DATE(review_time_vi) = ? AND level_vi > 0))`,
          [firebase_uid, formattedNextDate, formattedNextDate]
        );
        // Đếm số từ và số lượt học (chiều) thực tế
        let totalWords = 0;
        let totalDirections = 0;
        if (termsNext && (termsNext as any[]).length > 0) {
          for (const term of termsNext as any[]) {
            // Chuẩn hóa ngày về yyyy-mm-dd
            let reviewEn = '';
            let reviewVi = '';
            if (term.review_time_en) {
              if (typeof term.review_time_en === 'string') {
                reviewEn = term.review_time_en.slice(0, 10);
              } else {
                const date = new Date(term.review_time_en);
                date.setHours(date.getHours() + 7);
                reviewEn = date.toISOString().slice(0, 10);
              }
            }
            if (term.review_time_vi) {
              if (typeof term.review_time_vi === 'string') {
                reviewVi = term.review_time_vi.slice(0, 10);
              } else {
                const date = new Date(term.review_time_vi);
                date.setHours(date.getHours() + 7);
                reviewVi = date.toISOString().slice(0, 10);
              }
            }
            // Đếm chiều phù hợp
            let hasDirection = false;
            if (reviewEn === nextLearningInfo.nextDate && term.level_en > 0) {
              totalDirections++;
              hasDirection = true;
            }
            if (reviewVi === nextLearningInfo.nextDate && term.level_vi > 0) {
              totalDirections++;
              hasDirection = true;
            }
            if (hasDirection) totalWords++;
          }
        }
        console.log(`Số từ cần ôn tập: ${totalWords}`);
        console.log(`Số lượt học (chiều): ${totalDirections}`);
        // ---
        const nextDate = new Date(nextLearningInfo.nextDate);
        const todayDate = new Date(today);
        const daysDiff = Math.ceil((nextDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        let message = '';
        if (nextLearningInfo.isNewTerms) {
          message = `Bạn có ${totalWords} từ mới cần học!`;
        } else if (daysDiff === 0) {
          message = `Hôm nay có ${totalWords} từ cần ôn tập`;
        } else if (daysDiff === 1) {
          message = `Ngày mai có ${totalDirections} từ cần ôn tập`;
        } else {
          message = `Sau ${daysDiff} ngày nữa có ${totalDirections} từ cần ôn tập`;
        }
        return res.status(200).json({
          learningList: [],
          termsCount: 0,
          nextLearningDate: nextLearningInfo.nextDate,
          nextLearningCount: totalWords,
          daysUntilNext: daysDiff,
          message: message
        });
      } else {
        return res.status(200).json({
          learningList: [],
          termsCount: 0,
          message: 'Tất cả từ vựng đã được học xong! Hãy thêm từ mới để tiếp tục học.'
        });
      }
    }

    // Trả về danh sách lượt học
    return res.status(200).json({
      learningList,
      termsCount: termsToLearn.length,
      message: `Đã tìm thấy ${learningList.length} lượt học (${termsToLearn.length} từ vựng)`
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}