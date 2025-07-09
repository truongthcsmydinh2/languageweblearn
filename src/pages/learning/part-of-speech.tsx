import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

// Danh sách từ loại phổ biến
const PARTS_OF_SPEECH = [
  { value: 'noun', label: 'Danh từ', description: 'Từ chỉ người, vật, khái niệm' },
  { value: 'verb', label: 'Động từ', description: 'Từ chỉ hành động hoặc trạng thái' },
  { value: 'adjective', label: 'Tính từ', description: 'Từ bổ nghĩa cho danh từ' },
  { value: 'adverb', label: 'Trạng từ', description: 'Từ bổ nghĩa cho động từ, tính từ hoặc trạng từ khác' },
  { value: 'preposition', label: 'Giới từ', description: 'Từ chỉ quan hệ giữa các từ trong câu' },
  { value: 'conjunction', label: 'Liên từ', description: 'Từ nối các từ, cụm từ hoặc mệnh đề' },
  { value: 'pronoun', label: 'Đại từ', description: 'Từ thay thế cho danh từ' },
  { value: 'interjection', label: 'Thán từ', description: 'Từ biểu thị cảm xúc' },
  { value: 'phrase', label: 'Cụm từ', description: 'Nhóm từ có ý nghĩa, nhưng không phải là câu hoàn chỉnh' },
];

interface Term {
  id: number;
  vocab: string;
  meaning: string;
  part_of_speech: string | null;
}

interface AnswerResult {
  term: Term;
  selectedAnswer: string;
  isCorrect: boolean;
}

const PartOfSpeechPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [allTerms, setAllTerms] = useState<Term[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isLandingPage, setIsLandingPage] = useState(true);
  const [isResultPage, setIsResultPage] = useState(false);
  const [termCount, setTermCount] = useState(20);
  const [totalAvailableTerms, setTotalAvailableTerms] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [answerResults, setAnswerResults] = useState<AnswerResult[]>([]);

  useEffect(() => {
    // Kiểm tra đăng nhập
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Lấy danh sách từ vựng
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vocab/with-part-of-speech', {
          headers: {
            'firebase_uid': user.uid
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            // Lọc những từ đã có part_of_speech
            const termsWithPOS = data.filter(term => term.part_of_speech);
            // Shuffle để lấy ngẫu nhiên
            const shuffled = [...termsWithPOS].sort(() => 0.5 - Math.random());
            setAllTerms(shuffled);
            setTotalAvailableTerms(shuffled.length);
          } else {
            setAllTerms([]);
            setTotalAvailableTerms(0);
          }
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, [user, router]);

  const startLearning = () => {
    // Lấy số lượng từ theo người dùng chọn, nhưng không quá số từ có sẵn
    const numTerms = Math.min(termCount, allTerms.length);
    setTerms(allTerms.slice(0, numTerms));
    setIsLandingPage(false);
    setIsResultPage(false);
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
    setAnswerResults([]);
    setStartTime(new Date());
    setEndTime(null);
  };

  const handleSelectAnswer = (pos: string) => {
    setSelectedAnswer(pos);
    const currentTerm = terms[currentIndex];
    const correctAnswer = currentTerm?.part_of_speech;
    const isAnswerCorrect = pos === correctAnswer;
    setIsCorrect(isAnswerCorrect);

    // Lưu kết quả câu trả lời
    setAnswerResults(prev => [
      ...prev,
      {
        term: currentTerm,
        selectedAnswer: pos,
        isCorrect: isAnswerCorrect
      }
    ]);

    // Cập nhật điểm số
    setScore(prev => ({
      correct: isAnswerCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));

    // Đợi 1 giây rồi chuyển sang câu tiếp theo
    setTimeout(() => {
      if (currentIndex < terms.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Kết thúc bài tập
        setEndTime(new Date());
        setIsResultPage(true);
      }
      setSelectedAnswer(null);
      setIsCorrect(null);
    }, 1000);
  };

  const showResults = () => {
    setEndTime(new Date());
    setIsResultPage(true);
  };
  
  const backToLanding = () => {
    setIsLandingPage(true);
    setIsResultPage(false);
  };

  const getLabelForPartOfSpeech = (pos: string) => {
    const found = PARTS_OF_SPEECH.find(p => p.value === pos);
    return found ? found.label : pos;
  };

  const formatDuration = (startTime: Date | null, endTime: Date | null) => {
    if (!startTime || !endTime) return '';
    
    const diffInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-lg text-gray-200">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (allTerms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
        <div className="max-w-lg mx-auto bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
          <h1 className="text-2xl font-bold mb-4 text-primary-200">Không có đủ dữ liệu</h1>
          <p className="mb-4 text-gray-300">
            Bạn cần thêm từ vựng có từ loại để sử dụng tính năng này.
          </p>
          <button
            onClick={() => router.push('/vocab/add')}
            className="bg-gradient-to-r from-primary-200 to-secondary-200 text-gray-900 px-6 py-3 rounded-xl font-bold shadow hover:from-primary-300 hover:to-secondary-300 transition-all"
          >
            Thêm từ mới
          </button>
        </div>
      </div>
    );
  }

  // Hiển thị trang kết quả
  if (isResultPage) {
    const accuracy = score.total > 0 ? (score.correct / score.total) * 100 : 0;
    const incorrectAnswers = answerResults.filter(result => !result.isCorrect);
    return (
      <div className="min-h-screen bg-gray-900 py-10 px-4 flex items-center justify-center">
        <div className="max-w-3xl mx-auto bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-center mb-2 text-primary-200">Kết quả luyện tập</h1>
            <p className="text-center text-gray-400 mb-6">
              Bạn đã hoàn thành phần luyện tập từ loại!
            </p>
            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-success-200/10 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-success-200">{score.correct}/{score.total}</div>
                <div className="text-sm text-gray-300">Câu trả lời đúng</div>
              </div>
              <div className="bg-primary-200/10 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary-200">{accuracy.toFixed(1)}%</div>
                <div className="text-sm text-gray-300">Độ chính xác</div>
              </div>
              <div className="bg-secondary-200/10 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-secondary-200">{formatDuration(startTime, endTime)}</div>
                <div className="text-sm text-gray-300">Thời gian hoàn thành</div>
              </div>
            </div>
            {/* Danh sách từ trả lời sai */}
            {incorrectAnswers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3 text-error-200">Từ vựng cần lưu ý:</h2>
                <div className="bg-error-200/10 rounded-xl overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-error-200/20">
                      <tr>
                        <th className="py-2 px-4 text-left font-medium text-error-200">Từ vựng</th>
                        <th className="py-2 px-4 text-left font-medium text-error-200">Nghĩa</th>
                        <th className="py-2 px-4 text-left font-medium text-error-200">Đáp án đúng</th>
                        <th className="py-2 px-4 text-left font-medium text-error-200">Đáp án của bạn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-error-200/30">
                      {incorrectAnswers.map((result, index) => (
                        <tr key={index} className="hover:bg-error-200/20">
                          <td className="py-2 px-4 font-medium text-gray-100">{result.term.vocab}</td>
                          <td className="py-2 px-4 text-gray-300">{result.term.meaning}</td>
                          <td className="py-2 px-4 text-success-200">{getLabelForPartOfSpeech(result.term.part_of_speech || '')}</td>
                          <td className="py-2 px-4 text-error-200">{getLabelForPartOfSpeech(result.selectedAnswer)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Các nút điều hướng */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <button
                onClick={startLearning}
                className="bg-gradient-to-r from-primary-200 to-secondary-200 text-gray-900 py-3 px-8 rounded-xl font-bold shadow hover:from-primary-300 hover:to-secondary-300 transition-all"
              >
                Luyện tập lại
              </button>
              <button
                onClick={backToLanding}
                className="bg-gray-700 hover:bg-gray-600 text-gray-100 py-3 px-8 rounded-xl font-bold shadow transition-all"
              >
                Quay về trang chính
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị landing page
  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-gray-900 py-10 px-4 flex items-center justify-center">
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-center mb-2 text-primary-200">Luyện tập từ loại</h1>
            <p className="text-center text-gray-400 mb-6">
              Chọn từ loại đúng cho từ vựng để rèn luyện khả năng phân biệt từ loại
            </p>
            <div className="bg-primary-200/10 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-2 text-primary-200">Cách chơi:</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li>Bạn sẽ thấy một từ vựng và nghĩa của nó</li>
                <li>Chọn từ loại đúng cho từ đó</li>
                <li>Trả lời đúng để tích điểm</li>
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-gray-200">Số lượng từ vựng muốn học:</h3>
              <div className="flex items-center">
                <input
                  type="range"
                  min="5"
                  max={Math.min(100, totalAvailableTerms)}
                  value={termCount}
                  onChange={(e) => setTermCount(parseInt(e.target.value))}
                  className="flex-grow mr-4 accent-primary-200"
                />
                <div className="bg-primary-200/20 px-4 py-2 rounded-xl font-bold text-primary-200">
                  {termCount} từ
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Tổng số từ có sẵn: {totalAvailableTerms}
              </p>
            </div>
            <button
              onClick={startLearning}
              className="w-full bg-gradient-to-r from-primary-200 to-secondary-200 text-gray-900 py-4 rounded-xl font-bold shadow hover:from-primary-300 hover:to-secondary-300 transition-all text-lg"
            >
              Bắt đầu học
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị trang luyện tập
  const currentTerm = terms[currentIndex];
  return (
    <div className="min-h-screen bg-gray-900 py-10 px-4 flex items-center justify-center">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center mb-2 text-primary-200">Luyện tập từ loại</h1>
          <p className="text-center text-gray-400">
            Chọn từ loại đúng cho từ vựng bên dưới
          </p>
        </div>
        <div className="mb-8">
          <div className="text-center mb-2">
            <span className="text-sm text-gray-400">Từ {currentIndex + 1}/{terms.length}</span>
          </div>
          <div className="text-3xl font-bold text-center mb-2 text-gray-100">{currentTerm?.vocab}</div>
          <div className="text-gray-300 text-center italic">{currentTerm?.meaning}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {PARTS_OF_SPEECH.map((pos) => (
            <button
              key={pos.value}
              onClick={() => handleSelectAnswer(pos.value)}
              disabled={selectedAnswer !== null}
              className={`p-5 rounded-xl text-left font-semibold text-lg transition-all shadow-lg border-2 ${
                selectedAnswer === pos.value
                  ? isCorrect
                    ? 'bg-success-200/20 border-success-200 text-success-200 scale-105'
                    : 'bg-error-200/20 border-error-200 text-error-200 scale-105'
                  : 'bg-gray-700 border-gray-600 text-gray-200 hover:border-primary-200 hover:bg-primary-200/10'
              }`}
            >
              <div className="font-bold">{pos.label}</div>
              <div className="text-sm text-gray-400">{pos.description}</div>
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Đúng: {score.correct} / {score.total}
          </div>
          <button
            onClick={showResults}
            className="text-secondary-200 hover:text-secondary-300 text-sm font-bold"
          >
            Dừng lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartOfSpeechPage; 