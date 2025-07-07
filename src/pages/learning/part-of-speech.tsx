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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (allTerms.length === 0) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Không có đủ dữ liệu</h1>
          <p className="mb-4">
            Bạn cần thêm từ vựng có từ loại để sử dụng tính năng này.
          </p>
          <button
            onClick={() => router.push('/vocab/add')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center mb-2">Kết quả luyện tập</h1>
            <p className="text-center text-gray-600 mb-6">
              Bạn đã hoàn thành phần luyện tập từ loại!
            </p>
            
            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-700">{score.correct}/{score.total}</div>
                <div className="text-sm text-gray-600">Câu trả lời đúng</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-700">{accuracy.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Độ chính xác</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-700">{formatDuration(startTime, endTime)}</div>
                <div className="text-sm text-gray-600">Thời gian hoàn thành</div>
              </div>
            </div>
            
            {/* Danh sách từ trả lời sai */}
            {incorrectAnswers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Từ vựng cần lưu ý:</h2>
                <div className="bg-red-50 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-red-100">
                      <tr>
                        <th className="py-2 px-4 text-left font-medium text-red-800">Từ vựng</th>
                        <th className="py-2 px-4 text-left font-medium text-red-800">Nghĩa</th>
                        <th className="py-2 px-4 text-left font-medium text-red-800">Đáp án đúng</th>
                        <th className="py-2 px-4 text-left font-medium text-red-800">Đáp án của bạn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-200">
                      {incorrectAnswers.map((result, index) => (
                        <tr key={index} className="hover:bg-red-100">
                          <td className="py-2 px-4 font-medium">{result.term.vocab}</td>
                          <td className="py-2 px-4">{result.term.meaning}</td>
                          <td className="py-2 px-4">{getLabelForPartOfSpeech(result.term.part_of_speech || '')}</td>
                          <td className="py-2 px-4">{getLabelForPartOfSpeech(result.selectedAnswer)}</td>
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                Luyện tập lại
              </button>
              <button
                onClick={backToLanding}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg font-medium transition-colors duration-200"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center mb-2">Luyện tập từ loại</h1>
            <p className="text-center text-gray-600 mb-6">
              Chọn từ loại đúng cho từ vựng để rèn luyện khả năng phân biệt từ loại
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold mb-2">Cách chơi:</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Bạn sẽ thấy một từ vựng và nghĩa của nó</li>
                <li>Chọn từ loại đúng cho từ đó</li>
                <li>Trả lời đúng để tích điểm</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Số lượng từ vựng muốn học:</h3>
              <div className="flex items-center">
                <input
                  type="range"
                  min="5"
                  max={Math.min(100, totalAvailableTerms)}
                  value={termCount}
                  onChange={(e) => setTermCount(parseInt(e.target.value))}
                  className="flex-grow mr-4"
                />
                <div className="bg-indigo-100 px-3 py-1 rounded-lg font-medium">
                  {termCount} từ
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Tổng số từ có sẵn: {totalAvailableTerms}
              </p>
            </div>
            
            <button
              onClick={startLearning}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">Luyện tập từ loại</h1>
          <p className="text-center text-gray-600">
            Chọn từ loại đúng cho từ vựng bên dưới
          </p>
        </div>

        <div className="mb-8">
          <div className="text-center mb-2">
            <span className="text-sm text-gray-500">Từ {currentIndex + 1}/{terms.length}</span>
          </div>
          <div className="text-3xl font-bold text-center mb-2">{currentTerm?.vocab}</div>
          <div className="text-gray-600 text-center italic">{currentTerm?.meaning}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {PARTS_OF_SPEECH.map((pos) => (
            <button
              key={pos.value}
              onClick={() => handleSelectAnswer(pos.value)}
              disabled={selectedAnswer !== null}
              className={`p-3 rounded-lg text-left transition-colors ${
                selectedAnswer === pos.value
                  ? isCorrect
                    ? 'bg-green-100 border-2 border-green-500'
                    : 'bg-red-100 border-2 border-red-500'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium">{pos.label}</div>
              <div className="text-sm text-gray-600">{pos.description}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Đúng: {score.correct} / {score.total}
          </div>
          <button
            onClick={showResults}
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            Dừng lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartOfSpeechPage; 