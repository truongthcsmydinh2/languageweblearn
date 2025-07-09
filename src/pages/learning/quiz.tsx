import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Button, Card, Container, Form, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import styles from '@/styles/Learning.module.css';

interface Word {
  id: number;
  vocab?: string;
  meaning?: string;
  english?: string;
  vietnamese?: string;
  level_en: number;
  level_vi: number;
}

interface Question {
  word: string;
  question: string;
  options: string[];
  correctAnswer: string;
  vietnamese: string;
  answerIndex?: number; // Vị trí đáp án đúng (0-3)
}

const LEVELS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Mới (0)', value: 0 },
  { label: 'Cấp 1', value: 1 },
  { label: 'Cấp 2', value: 2 },
  { label: 'Cấp 3', value: 3 },
  { label: 'Cấp 4', value: 4 },
  { label: 'Cấp 5', value: 5 },
  { label: 'Cấp 6', value: 6 },
  { label: 'Cấp 7', value: 7 },
  { label: 'Cấp 8', value: 8 },
  { label: 'Cấp 9', value: 9 },
  { label: 'Cấp 10', value: 10 },
];

const QuizMode = () => {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numberOfQuestions, setNumberOfQuestions] = useState<string>('');
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [questionMode, setQuestionMode] = useState<'setup' | 'quiz' | 'results'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'all' | number>('all');
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);

  // Fetch user's words
  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await axios.get('/api/vocab');
        // Đảm bảo meaning luôn có giá trị: ưu tiên meaning, sau đó vietnamese, sau đó meanings[0]
        const mapped = (response.data || []).map((w: any) => ({
          ...w,
          meaning: w.meaning || w.vietnamese || (Array.isArray(w.meanings) && w.meanings.length > 0 ? w.meanings[0] : '')
        }));
        setWords(mapped);
        setMaxQuestions(mapped.length);
        setLoading(false);
      } catch (err) {
        setError('Đã xảy ra lỗi khi tải từ vựng. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchWords();
  }, []);

  // Lọc từ vựng theo level
  const filteredWords = selectedLevel === 'all'
    ? words
    : words.filter(w => w.level_en === selectedLevel || w.level_vi === selectedLevel);

  // Lấy danh sách từ đã chọn
  const selectedWords = filteredWords.filter(w => selectedWordIds.includes(w.id));

  // Khi đổi level thì reset chọn từ và cập nhật lại số lượng câu hỏi
  useEffect(() => {
    setSelectedWordIds([]);
    setNumberOfQuestions(filteredWords.length > 0 ? filteredWords.length.toString() : '');
  }, [selectedLevel]);

  // Khi tick chọn từ thì cập nhật lại số lượng câu hỏi đúng bằng số từ đã chọn (nếu có chọn)
  useEffect(() => {
    if (selectedWordIds.length > 0) {
      setNumberOfQuestions(selectedWordIds.length.toString());
    } else {
      setNumberOfQuestions(filteredWords.length > 0 ? filteredWords.length.toString() : '');
    }
  }, [selectedWordIds, filteredWords.length]);

  // Generate questions using Google Gemini API
  const generateQuestions = async () => {
    const num = parseInt(numberOfQuestions);
    const sourceWords = selectedWords.length > 0 ? selectedWords : filteredWords;
    if (!num || num <= 0 || num > sourceWords.length) {
      setError(`Số lượng câu hỏi phải lớn hơn 0 và nhỏ hơn hoặc bằng ${sourceWords.length}`);
      return;
    }
    setIsGeneratingQuestions(true);
    setError(null);
    try {
      if (!Array.isArray(sourceWords) || sourceWords.length === 0) {
        setError('Không tìm thấy từ vựng nào. Vui lòng thêm từ vựng trước khi sử dụng tính năng này.');
        setIsGeneratingQuestions(false);
        return;
      }
      const validWords = sourceWords.filter(word => word && word.vocab && word.meaning).map(word => ({
        ...word,
        english: word.vocab,
        vietnamese: word.meaning
      }));
      if (validWords.length === 0) {
        setError('Không tìm thấy từ vựng hợp lệ. Vui lòng thêm từ vựng trước khi sử dụng tính năng này.');
        setIsGeneratingQuestions(false);
        return;
      }
      const shuffledWords = [...validWords].sort(() => 0.5 - Math.random());
      const selectedWordsForQuiz = shuffledWords.slice(0, Math.min(num, validWords.length));
      // Chuẩn bị settings mặc định
      const settings = {
        questionTypes: { multipleChoice: true, trueFalse: false, essay: false },
        languages: { english: false, vietnamese: true },
        selectedLevels: selectedLevel === 'all' ? [] : [selectedLevel]
      };
      const response = await axios.post('/api/learning/generate-quiz', {
        words: selectedWordsForQuiz,
        settings
      });
      if (!response.data.questions || !Array.isArray(response.data.questions) || response.data.questions.length === 0) {
        setError('Không thể tạo câu hỏi. Phản hồi từ API không đúng định dạng.');
        setIsGeneratingQuestions(false);
        return;
      }
      setQuestions(response.data.questions);
      setQuestionMode('quiz');
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } catch (err) {
      setError('Đã xảy ra lỗi khi tạo câu hỏi. Vui lòng thử lại sau.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAnswerSelection = (option: string) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(option);
  };

  const checkAnswer = () => {
    if (!selectedAnswer || isAnswerChecked) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    // Kiểm tra dựa trên answerIndex (nếu có) hoặc correctAnswer
    const isCorrect = currentQuestion.answerIndex !== undefined 
      ? selectedAnswer === currentQuestion.options[currentQuestion.answerIndex]
      : selectedAnswer === currentQuestion.correctAnswer;
      
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setIsAnswerChecked(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      // Quiz completed
      setQuestionMode('results');
    }
  };

  const restartQuiz = () => {
    setQuestionMode('setup');
    setQuestions([]);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setCurrentQuestionIndex(0);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-200"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-8 px-2">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-200 mb-2 drop-shadow">Chế độ Trắc nghiệm Thông minh</h1>
        </div>
        {error && (
          <div className="bg-error-200/10 border-l-4 border-error-200 p-4 mb-6 rounded-xl text-error-200 text-base">
            {error}
          </div>
        )}
        {questionMode === 'setup' && (
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-primary-200 mb-6">Thiết lập trắc nghiệm</h2>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Chọn cấp độ từ vựng</label>
                <select
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 text-primary-200 border-2 border-primary-200 focus:outline-none focus:border-secondary-200 text-lg font-bold"
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                >
                  {LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Số lượng câu hỏi (tối đa {selectedWords.length > 0 ? selectedWords.length : filteredWords.length})</label>
                <input
                  type="number"
                  min="1"
                  max={selectedWords.length > 0 ? selectedWords.length : filteredWords.length}
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(e.target.value)}
                  onFocus={e => e.target.select()}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 text-primary-200 border-2 border-primary-200 focus:outline-none focus:border-secondary-200 text-lg font-bold"
                />
              </div>
            </div>
            <div className="mb-6 max-h-64 overflow-y-auto border border-gray-700 rounded-xl bg-gray-900">
              <table className="min-w-full text-sm text-gray-200">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="p-2 text-left font-semibold"><input type="checkbox" checked={selectedWordIds.length === filteredWords.length && filteredWords.length > 0} onChange={e => setSelectedWordIds(e.target.checked ? filteredWords.map(w => w.id) : [])} /></th>
                    <th className="p-2 text-left font-semibold">Từ vựng</th>
                    <th className="p-2 text-left font-semibold">Nghĩa</th>
                    <th className="p-2 text-left font-semibold">Cấp độ EN</th>
                    <th className="p-2 text-left font-semibold">Cấp độ VI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWords.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-4">Không có từ vựng nào ở cấp độ này.</td></tr>
                  ) : filteredWords.map(word => {
                    const isSelected = selectedWordIds.includes(word.id);
                    return (
                      <tr
                        key={word.id}
                        className={isSelected ? 'bg-primary-200/10 cursor-pointer' : 'cursor-pointer hover:bg-primary-200/5'}
                        onClick={e => {
                          // Nếu click vào ô checkbox thì không toggle ở đây
                          if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
                          if (isSelected) setSelectedWordIds(ids => ids.filter(id => id !== word.id));
                          else setSelectedWordIds(ids => [...ids, word.id]);
                        }}
                      >
                        <td className="p-2" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              if (e.target.checked) setSelectedWordIds(ids => [...ids, word.id]);
                              else setSelectedWordIds(ids => ids.filter(id => id !== word.id));
                            }}
                          />
                        </td>
                        <td className="p-2 font-bold">{word.vocab}</td>
                        <td className="p-2">{word.meaning || <span className="italic text-gray-400">(Chưa có nghĩa)</span>}</td>
                        <td className="p-2">{word.level_en}</td>
                        <td className="p-2">{word.level_vi}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              onClick={generateQuestions}
              disabled={isGeneratingQuestions || (filteredWords.length === 0)}
              className="w-full px-6 py-4 bg-gradient-to-r from-primary-200 to-secondary-200 text-gray-900 font-bold rounded-xl shadow-lg hover:from-primary-300 hover:to-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-all"
            >
              {isGeneratingQuestions ? (
                <>
                  <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 inline-block mr-2 align-middle"></span>
                  Đang tạo câu hỏi...
                </>
              ) : 'Bắt đầu làm bài'}
            </button>
          </div>
        )}
        {questionMode === 'quiz' && questions.length > 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
            <div className="mb-6">
              <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                <div
                  className="bg-gradient-to-r from-primary-200 to-secondary-200 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
              <div className="text-gray-400 text-center text-sm mb-2">
                Câu {currentQuestionIndex + 1}/{questions.length}
              </div>
            </div>
            {questions[currentQuestionIndex] ? (
              <>
                <div className="my-6">
                  <p className="text-xl font-bold text-gray-100 mb-6 text-center">{questions[currentQuestionIndex].question}</p>
                  <div className="mt-3 grid grid-cols-1 gap-4">
                    {questions[currentQuestionIndex].options.map((option, index) => {
                      const isCorrectAnswer = questions[currentQuestionIndex].answerIndex !== undefined
                        ? index === questions[currentQuestionIndex].answerIndex
                        : option === questions[currentQuestionIndex].correctAnswer;
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelection(option)}
                          disabled={isAnswerChecked}
                          className={`w-full p-4 rounded-xl font-semibold text-lg border-2 transition-all shadow-lg text-left ${
                            selectedAnswer === option
                              ? isAnswerChecked
                                ? isCorrectAnswer
                                  ? 'bg-success-200/20 border-success-200 text-success-200 scale-105'
                                  : 'bg-error-200/20 border-error-200 text-error-200 scale-105'
                                : 'bg-primary-200/20 border-primary-200 text-primary-200 scale-105'
                              : isAnswerChecked && isCorrectAnswer
                                ? 'bg-success-200/10 border-success-200 text-success-200'
                                : 'bg-gray-700 border-gray-600 text-gray-200 hover:border-primary-200 hover:bg-primary-200/10'
                          }`}
                          style={{ cursor: isAnswerChecked ? 'default' : 'pointer' }}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex justify-center gap-4">
                    {!isAnswerChecked ? (
                      <button
                        onClick={checkAnswer}
                        disabled={!selectedAnswer}
                        className="px-8 py-4 bg-gradient-to-r from-primary-200 to-secondary-200 text-gray-900 font-bold rounded-xl shadow-lg hover:from-primary-300 hover:to-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-all"
                      >
                        Kiểm tra
                      </button>
                    ) : (
                      <button
                        onClick={nextQuestion}
                        className="px-8 py-4 bg-success-200 text-gray-900 font-bold rounded-xl shadow-lg hover:bg-success-300 text-lg transition-all"
                      >
                        {currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-warning-200/10 border-l-4 border-warning-200 p-4 rounded-xl text-warning-200 text-base text-center">Không tìm thấy câu hỏi</div>
            )}
          </div>
        )}
        {questionMode === 'results' && (
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 text-center">
            <h2 className="text-3xl font-bold text-primary-200 mb-4">Kết quả</h2>
            <p className="text-xl text-gray-100 mb-2">Bạn đã trả lời đúng <span className="text-success-200 font-bold">{score}/{questions.length}</span> câu hỏi</p>
            <p className="text-lg text-gray-300 mb-8">Tỷ lệ chính xác: <span className="text-primary-200 font-bold">{((score / questions.length) * 100).toFixed(1)}%</span></p>
            <button
              onClick={restartQuiz}
              className="px-8 py-4 bg-gradient-to-r from-primary-200 to-secondary-200 text-gray-900 font-bold rounded-xl shadow-lg hover:from-primary-300 hover:to-secondary-300 text-lg transition-all"
            >
              Làm lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizMode;