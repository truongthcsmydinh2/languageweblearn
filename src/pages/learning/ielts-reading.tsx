import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface Passage {
  id: number;
  title: string;
  content: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  time_limit: number;
  question_count: number;
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  order_index: number;
}

const IeltsReadingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState({
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    timeTaken: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    fetchPassages();
  }, [user, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTestActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isTestActive && timeLeft === 0) {
      finishTest();
    }
    return () => clearTimeout(timer);
  }, [isTestActive, timeLeft]);

  const fetchPassages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ielts-reading/passages');
      if (response.ok) {
        const data = await response.json();
        setPassages(data.passages);
      }
    } catch (error) {
      console.error('Error fetching passages:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (passage: Passage) => {
    try {
      const response = await fetch(`/api/ielts-reading/questions/${passage.id}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setSelectedPassage(passage);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setTimeLeft(passage.time_limit * 60); // Convert to seconds
        setIsTestActive(true);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const handleAnswer = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishTest = async () => {
    const correctAnswers = questions.reduce((count, question, index) => {
      const userAnswer = userAnswers[index];
      return count + (userAnswer === question.correct_answer ? 1 : 0);
    }, 0);

    const results = {
      score: Math.round((correctAnswers / questions.length) * 100),
      totalQuestions: questions.length,
      correctAnswers,
      timeTaken: selectedPassage!.time_limit * 60 - timeLeft
    };

    setTestResults(results);
    setShowResults(true);
    setIsTestActive(false);

    // Save results to database
    try {
      await fetch('/api/ielts-reading/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify({
          passage_id: selectedPassage!.id,
          score: results.score,
          total_questions: results.totalQuestions,
          correct_answers: results.correctAnswers,
          time_taken: results.timeTaken,
          answers: userAnswers
        })
      });
    } catch (error) {
      console.error('Error submitting results:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
      </div>
    );
  }

  if (isTestActive && selectedPassage) {
    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];

    return (
      <div className="min-h-screen bg-gray-800 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-50">{selectedPassage.title}</h1>
              <div className="text-right">
                <div className="text-lg font-semibold text-red-400">
                  Thời gian: {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-300">
                  Câu hỏi {currentQuestionIndex + 1}/{questions.length}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reading Passage */}
            <div className="bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-50 mb-4">Bài đọc</h2>
              <div className="bg-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedPassage.content}
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-50 mb-4">Câu hỏi {currentQuestionIndex + 1}</h2>
              <div className="mb-6">
                <p className="text-gray-200 mb-4">{currentQuestion.question_text}</p>
                
                {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <label key={index} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${currentQuestionIndex}`}
                          value={option}
                          checked={userAnswer === option}
                          onChange={() => handleAnswer(option)}
                          className="text-primary-200 focus:ring-primary-200"
                        />
                        <span className="text-gray-200">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.question_type === 'true_false' && (
                  <div className="space-y-3">
                    {['True', 'False'].map((option) => (
                      <label key={option} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${currentQuestionIndex}`}
                          value={option}
                          checked={userAnswer === option}
                          onChange={() => handleAnswer(option)}
                          className="text-primary-200 focus:ring-primary-200"
                        />
                        <span className="text-gray-200">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.question_type === 'fill_blank' && (
                  <div>
                    <input
                      type="text"
                      value={userAnswer || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary-200 focus:border-transparent"
                      placeholder="Nhập câu trả lời..."
                    />
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500"
                >
                  Câu trước
                </button>
                
                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={finishTest}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Kết thúc
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Câu tiếp
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-800 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-700 rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-50 mb-6">Kết quả bài thi</h1>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-600 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary-200">{testResults.score}%</div>
                <div className="text-gray-300">Điểm số</div>
              </div>
              <div className="bg-gray-600 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{testResults.correctAnswers}/{testResults.totalQuestions}</div>
                <div className="text-gray-300">Câu đúng</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-lg text-gray-300 mb-2">Thời gian làm bài: {formatTime(testResults.timeTaken)}</div>
              <div className="text-lg text-gray-300">Bài đọc: {selectedPassage?.title}</div>
            </div>

            <div className="space-x-4">
              <button
                onClick={() => {
                  setShowResults(false);
                  setSelectedPassage(null);
                }}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Làm bài khác
              </button>
              <button
                onClick={() => router.push('/learning')}
                className="px-6 py-3 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500"
              >
                Về trang học
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-50 mb-4">IELTS Reading Practice</h1>
          <p className="text-xl text-gray-300">Luyện tập kỹ năng đọc hiểu với các bài đọc IELTS</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {passages.map((passage) => (
            <div key={passage.id} className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  passage.level === 'beginner' ? 'bg-green-600 text-green-100' :
                  passage.level === 'intermediate' ? 'bg-yellow-600 text-yellow-100' :
                  'bg-red-600 text-red-100'
                }`}>
                  {passage.level === 'beginner' ? 'Cơ bản' :
                   passage.level === 'intermediate' ? 'Trung bình' : 'Nâng cao'}
                </span>
                <span className="text-sm text-gray-400">{passage.time_limit} phút</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-50 mb-3">{passage.title}</h3>
              <p className="text-gray-300 mb-4">{passage.category}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <span>{passage.question_count} câu hỏi</span>
              </div>
              
              <button
                onClick={() => startTest(passage)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Bắt đầu làm bài
              </button>
            </div>
          ))}
        </div>

        {passages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Chưa có bài đọc nào được tạo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IeltsReadingPage; 