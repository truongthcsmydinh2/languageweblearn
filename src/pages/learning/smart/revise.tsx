import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface Term {
  id: number;
  vocab: string;
  meanings: string | string[];
  status_learning_en?: string;
  status_learning_vi?: string;
}

interface WrongTerm {
  term: Term;
  mode: 'en_to_vi' | 'vi_to_en';
}

function removeDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[đĐ]/g, (match) => match === 'đ' ? 'd' : 'D');
}

function normalizeForComparison(text: string): string {
  return removeDiacritics(text.toLowerCase().trim());
}

function safeMeanings(meanings: string | string[] | undefined): string {
  if (!meanings) return 'Không có nghĩa';
  if (Array.isArray(meanings)) {
    if (meanings.length === 0) return 'Không có nghĩa';
    return meanings.filter(Boolean).join(', ');
  }
  return meanings;
}

const RevisePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [terms, setTerms] = useState<Term[]>([]);
  const [reviewingList, setReviewingList] = useState<WrongTerm[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchReviewingTerms();
  }, [user]);

  const fetchReviewingTerms = async () => {
    if (!user || !user.uid) return;
    const response = await fetch(`/api/learning/smart`, {
      headers: {
        'firebase_uid': user?.uid || '',
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data.terms && data.terms.length > 0) {
      setTerms(data.terms);
      const list: WrongTerm[] = [];
      data.terms.forEach((term: Term) => {
        if (term.status_learning_en === 'reviewing') list.push({ term, mode: 'vi_to_en' });
        if (term.status_learning_vi === 'reviewing') list.push({ term, mode: 'en_to_vi' });
      });
      setReviewingList(list);
      setCurrentIdx(0);
      setFinished(list.length === 0);
    } else {
      setFinished(true);
    }
  };

  const getCurrent = () => reviewingList[currentIdx];

  const handleAnswer = async () => {
    if (!getCurrent() || userAnswer.trim() === '') return;
    const { term, mode } = getCurrent();
    let isCorrect = false;
    if (mode === 'en_to_vi') {
      const correctAnswers = Array.isArray(term.meanings) ? term.meanings : [term.meanings];
      isCorrect = correctAnswers.some((ans: string) => normalizeForComparison(ans) === normalizeForComparison(userAnswer));
    } else {
      isCorrect = normalizeForComparison(term.vocab) === normalizeForComparison(userAnswer);
    }
    setIsAnswerCorrect(isCorrect);
    if (isCorrect) {
      // Gọi API update-level để set status về null
      await fetch('/api/learning/update-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify({
          term_id: term.id,
          is_correct: true,
          mode
        })
      });
    } else {
      // Gọi API update-level để giữ status là reviewing
      await fetch('/api/learning/update-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify({
          term_id: term.id,
          is_correct: false,
          mode
        })
      });
    }
  };

  const next = async () => {
    if (currentIdx < reviewingList.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setUserAnswer('');
      setIsAnswerCorrect(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reload lại danh sách từ sai
      await fetchReviewingTerms();
      setUserAnswer('');
      setIsAnswerCorrect(null);
    }
  };

  const current = getCurrent();
  if (!current) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-gray-800 rounded-xl text-center">
        <h2 className="text-2xl font-bold text-error-200 mb-4">Không còn từ nào để ôn tập lại!</h2>
        <button
          onClick={() => router.push('/learning/smart')}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-lg font-semibold hover:from-primary-300 hover:to-primary-400 transition-all duration-200"
        >
          Quay lại học thông minh
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-gray-800 rounded-xl text-center">
        <h2 className="text-3xl font-bold text-success-200 mb-4">🎉 Bạn đã ôn tập lại hết các từ sai!</h2>
        <button
          onClick={() => router.push('/learning/smart')}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-lg font-semibold hover:from-primary-300 hover:to-primary-400 transition-all duration-200"
        >
          Quay lại học thông minh
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-16 p-8 bg-gray-800 rounded-xl">
      <h2 className="text-2xl font-bold text-error-200 mb-6 text-center">Ôn tập lại các từ sai</h2>
      <div className="mb-6 text-center">
        <span className="inline-block bg-error-200 text-gray-800 rounded-full px-4 py-1 font-semibold">
          {currentIdx + 1} / {reviewingList.length}
        </span>
      </div>
      <div className="mb-6">
        <div className="text-lg text-gray-300 mb-2">{current.mode === 'en_to_vi' ? 'Anh → Việt' : 'Việt → Anh'}</div>
        <div className="text-2xl font-bold text-gray-50 mb-4">{current.mode === 'en_to_vi' ? current.term.vocab : safeMeanings(current.term.meanings)}</div>
        <input
          ref={inputRef}
          type="text"
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          placeholder={current.mode === 'en_to_vi' ? 'Nhập nghĩa tiếng Việt...' : 'Nhập từ tiếng Anh...'}
          className="w-full px-6 py-4 text-xl border-2 rounded-xl bg-gray-900 text-gray-50 placeholder-gray-500 focus:outline-none border-gray-600 focus:border-primary-200 focus:ring-2 focus:ring-primary-200/20"
          disabled={isAnswerCorrect !== null}
        />
      </div>
      {isAnswerCorrect !== null && (
        <div className={`mb-6 p-4 rounded-xl ${isAnswerCorrect ? 'bg-success-200 text-gray-800' : 'bg-error-200 text-gray-800'}`}>
          {isAnswerCorrect ? 'Chính xác!' : 'Sai rồi!'}
        </div>
      )}
      <div className="flex justify-center gap-4">
        {isAnswerCorrect !== null ? (
          <button
            onClick={next}
            className="px-6 py-3 bg-gradient-to-r from-secondary-200 to-secondary-300 text-gray-800 rounded-lg font-semibold hover:from-secondary-300 hover:to-secondary-400 transition-all duration-200"
          >
            Tiếp tục
          </button>
        ) : (
          <button
            onClick={handleAnswer}
            className="px-6 py-3 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-lg font-semibold hover:from-primary-300 hover:to-primary-400 transition-all duration-200"
          >
            Kiểm tra
          </button>
        )}
      </div>
    </div>
  );
};

export default RevisePage; 