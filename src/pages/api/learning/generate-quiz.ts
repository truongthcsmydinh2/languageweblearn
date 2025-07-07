// src/pages/api/learning/generate-quiz.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface Word {
  id: number;
  english?: string;
  vietnamese?: string;
  vocab?: string;
  meaning?: string;
  level_en?: number;
  level_vi?: number;
}

interface GeneratedQuestion {
  word: string;
  question: string;
  options: string[];
  correctAnswer: string;
  vietnamese: string;
  answerIndex?: number; // Vị trí đáp án đúng (0-3)
  type: 'multipleChoice' | 'trueFalse' | 'essay';
}

interface ExamSettings {
  selectedLevels: number[];
  questionTypes: {
    multipleChoice: boolean;
    trueFalse: boolean;
    essay: boolean;
  };
  languages: {
    english: boolean;
    vietnamese: boolean;
  };
}

function getRandomElements<T>(arr: T[], n: number): T[] {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { words, settings } = req.body as { words: Word[]; settings: ExamSettings };
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ message: 'Invalid request: words array is required' });
    }
    if (!settings) {
      return res.status(400).json({ message: 'Invalid request: settings are required' });
    }

    // Lọc các loại câu hỏi được chọn
    const enabledTypes = Object.entries(settings.questionTypes)
      .filter(([_, v]) => v)
      .map(([k]) => k as 'multipleChoice' | 'trueFalse' | 'essay');
    const enabledLangs = Object.entries(settings.languages)
      .filter(([_, v]) => v)
      .map(([k]) => k as 'english' | 'vietnamese');

    const questions: GeneratedQuestion[] = [];
    const usedWordIds = new Set<number>();

    // Sinh câu hỏi cho từng từ
    for (const word of words) {
      // Chỉ lấy nghĩa và từ hợp lệ
      const vocab = word.vocab || word.english || '';
      const meaning = word.meaning || word.vietnamese || '';
      if (!vocab || !meaning) continue;

      // Chọn loại câu hỏi ngẫu nhiên từ các loại được chọn
      const type = getRandomElements(enabledTypes, 1)[0];
      // Chọn ngôn ngữ ngẫu nhiên từ các ngôn ngữ được chọn
      const lang = getRandomElements(enabledLangs, 1)[0];

      // Trắc nghiệm
      if (type === 'multipleChoice') {
        // Đáp án đúng
        const correct = lang === 'english' ? meaning : vocab;
        // Đáp án nhiễu
        const distractors = getRandomElements(
          words.filter(w => w.id !== word.id && (w.meaning || w.vietnamese) && (w.vocab || w.english)),
          3
        ).map(w => lang === 'english' ? (w.meaning || w.vietnamese || '') : (w.vocab || w.english || ''));
        // Trộn đáp án
        const options = getRandomElements([correct, ...distractors], 4);
        const answerIndex = options.findIndex(opt => opt === correct);
        questions.push({
          word: vocab,
          question: lang === 'english'
            ? `Nghĩa của từ "${vocab}" là gì?`
            : `Từ tiếng Anh cho nghĩa "${meaning}" là gì?`,
          options,
          correctAnswer: correct,
          vietnamese: meaning,
          answerIndex,
          type: 'multipleChoice'
        });
      }

      // Đúng/Sai
      if (type === 'trueFalse') {
        // 50% đúng, 50% sai
        const isCorrect = Math.random() < 0.5;
        let shownMeaning = meaning;
        if (!isCorrect) {
          // Lấy nghĩa sai từ từ khác
          const other = getRandomElements(words.filter(w => w.id !== word.id && (w.meaning || w.vietnamese)), 1)[0];
          if (other) shownMeaning = other.meaning || other.vietnamese || shownMeaning;
        }
        questions.push({
          word: vocab,
          question: lang === 'english'
            ? `Nghĩa của từ "${vocab}" là "${shownMeaning}" đúng hay sai?`
            : `Từ tiếng Anh cho nghĩa "${shownMeaning}" là "${vocab}" đúng hay sai?`,
          options: ['Đúng', 'Sai'],
          correctAnswer: isCorrect ? 'Đúng' : 'Sai',
          vietnamese: meaning,
          answerIndex: isCorrect ? 0 : 1,
          type: 'trueFalse'
        });
      }

      // Tự luận
      if (type === 'essay') {
        questions.push({
          word: vocab,
          question: lang === 'english'
            ? `Hãy nhập nghĩa tiếng Việt của từ ${vocab}:`
            : `Hãy nhập từ tiếng Anh cho nghĩa ${meaning}:`,
          options: [],
          correctAnswer: lang === 'english' ? meaning : vocab,
          vietnamese: meaning,
          type: 'essay'
        });
      }
    }

    // Trả về danh sách câu hỏi đã sinh
    return res.status(200).json({ questions });
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    return res.status(500).json({ message: 'Lỗi khi sinh câu hỏi kiểm tra', error: String(error) });
  }
}