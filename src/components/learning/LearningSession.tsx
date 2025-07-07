import React, { useState } from 'react';
import { useLearningSession } from '@/hooks/useLearningSession';
import { VocabWord } from '@/types/vocab';

interface LearningSessionProps {
  section: number;
  onComplete: () => void;
}

const LearningSession: React.FC<LearningSessionProps> = ({ section, onComplete }) => {
  const {
    currentWord,
    currentIndex,
    totalWords,
    stats,
    isLoading,
    isSessionFinished,
    handleAnswer,
    finishSession
  } = useLearningSession(section);
  
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Xử lý khi submit câu trả lời
  const handleSubmitAnswer = () => {
    if (!currentWord) return;
    
    // Kiểm tra câu trả lời
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = currentWord.meaning.trim().toLowerCase();
    
    const correct = normalizedUserAnswer === normalizedCorrectAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Tự động chuyển sang từ tiếp theo sau 2 giây
    setTimeout(() => {
      handleAnswer(correct);
      setUserAnswer('');
      setShowResult(false);
    }, 2000);
  };
  
  // Xử lý khi kết thúc phiên học
  const handleFinish = () => {
    finishSession();
    onComplete();
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Phiên học đã kết thúc
  if (isSessionFinished) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Phiên học đã kết thúc!</h2>
        
        <div className="bg-indigo-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-indigo-700 mb-2">Thống kê</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm text-gray-600">Tổng số từ:</div>
            <div className="text-sm font-medium">{stats.totalWords}</div>
            
            <div className="text-sm text-gray-600">Từ mới:</div>
            <div className="text-sm font-medium">{stats.newWords}</div>
            
            <div className="text-sm text-gray-600">Từ ôn tập:</div>
            <div className="text-sm font-medium">{stats.reviewWords}</div>
            
            <div className="text-sm text-gray-600">Trả lời đúng:</div>
            <div className="text-sm font-medium text-green-600">{stats.correctAnswers}</div>
            
            <div className="text-sm text-gray-600">Trả lời sai:</div>
            <div className="text-sm font-medium text-red-600">{stats.incorrectAnswers}</div>
            
            <div className="text-sm text-gray-600">Tỷ lệ đúng:</div>
            <div className="text-sm font-medium">{Math.round(stats.completionRate)}%</div>
          </div>
        </div>
        
        <button
          onClick={handleFinish}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Hoàn thành
        </button>
      </div>
    );
  }
  
  // Hiển thị từ hiện tại
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-indigo-700">
          Phần {section} - {section <= 5 ? `Học từ mới (${section}/5)` : 'Ôn tập từ khó'}
        </h2>
        
        <div className="bg-indigo-100 text-indigo-800 font-medium text-sm py-1 px-3 rounded-full">
          {currentIndex + 1} / {totalWords}
        </div>
      </div>
      
      {currentWord && (
        <div className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-indigo-800 mb-2">{currentWord.text}</h3>
              <div className="text-xs text-gray-500">
                {currentWord.section <= section && !currentWord.isLearned 
                  ? 'Từ mới' 
                  : 'Ôn tập'}
                {currentWord.wrongCount > 0 && ` - Đã trả lời sai ${currentWord.wrongCount} lần`}
                {` - Level ${currentWord.level}`}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
              Nhập nghĩa:
            </label>
            <input
              id="answer"
              type="text"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Nhập nghĩa của từ này..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              disabled={showResult}
            />
          </div>
          
          {showResult ? (
            <div className={`p-3 rounded-lg text-center ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isCorrect ? 'Chính xác!' : `Sai rồi! Đáp án đúng là: ${currentWord.meaning}`}
            </div>
          ) : (
            <button
              onClick={handleSubmitAnswer}
              disabled={userAnswer.trim() === ''}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kiểm tra
            </button>
          )}
        </div>
      )}
      
      {/* Progress bar */}
      <div className="mt-8">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Tiến độ</span>
          <span>{Math.round((currentIndex / totalWords) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-indigo-600 rounded-full"
            style={{ width: `${(currentIndex / totalWords) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LearningSession; 