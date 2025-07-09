import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout';
import { 
  MdTimer, 
  MdCheckCircle, 
  MdCancel, 
  MdArrowBack, 
  MdArrowForward, 
  MdPlayArrow,
  MdRefresh,
  MdSchool,
  MdTrendingUp,
  MdAccessTime,
  MdGrade,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdLanguage,
  MdHistory
} from 'react-icons/md';

interface Word {
  id: number;
  vocab?: string;
  meaning?: string;
  english?: string;
  vietnamese?: string;
  level_en: number;
  level_vi: number;
  firebase_uid: string;
}

interface Question {
  word: string;
  question: string;
  options: string[];
  correctAnswer: string;
  vietnamese: string;
  answerIndex?: number;
}

interface ExamResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  grade: string;
  details: {
    questionIndex: number;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

interface ExamHistory {
  id: number;
  firebase_uid: string;
  exam_date: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  accuracy: number;
  grade: string;
  settings: any;
  details: any;
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

const ExamPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examMode, setExamMode] = useState<'setup' | 'exam' | 'results'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  
  // Thêm state mới cho tính năng hiển thị đáp án và theo dõi câu đã trả lời
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentAnswerCorrect, setCurrentAnswerCorrect] = useState<boolean | null>(null);
  const [justChecked, setJustChecked] = useState(false);
  
  // Thêm ref cho textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // State cho lịch sử bài kiểm tra
  const [showHistory, setShowHistory] = useState(false);
  const [examHistory, setExamHistory] = useState<ExamHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<ExamHistory | null>(null);
  
  // Exam settings
  const [examSettings, setExamSettings] = useState<ExamSettings>({
    selectedLevels: [],
    questionTypes: {
      multipleChoice: true,
      trueFalse: false,
      essay: false
    },
    languages: {
      english: true,
      vietnamese: false
    }
  });

  // Fetch user's words
  useEffect(() => {
    const fetchWords = async () => {
      if (!user?.uid) {
        setError('Bạn cần đăng nhập để sử dụng tính năng này');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/vocab', {
          headers: {
            'firebase_uid': user.uid
          }
        });
        const data = await response.json();
        setWords(data);
        setLoading(false);
      } catch (err) {
        setError('Đã xảy ra lỗi khi tải từ vựng. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchWords();
  }, [user]);

  // Xử lý phím Enter cho exam mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chỉ xử lý khi đang ở exam mode và có câu hỏi
      if (examMode !== 'exam' || questions.length === 0) return;
      
      const currentQuestion = questions[currentQuestionIndex];
      
      // Xử lý phím số 1, 2, 3, 4 cho câu hỏi trắc nghiệm
      if (['1', '2', '3', '4'].includes(e.key) && !showAnswer && currentQuestion.options.length > 0) {
        e.preventDefault();
        const optionIndex = parseInt(e.key) - 1;
        if (optionIndex < currentQuestion.options.length) {
          handleAnswerSelection(currentQuestion.options[optionIndex]);
        }
        return;
      }
      
      // Chỉ xử lý phím Enter
      if (e.key !== 'Enter') return;
      
      // Kiểm tra xem có đang focus vào textarea không
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === 'TEXTAREA') {
        // Nếu đang focus vào textarea, không xử lý Enter để tránh xung đột
        return;
      }
      
      // Nếu vừa mới kiểm tra, không xử lý Enter để tránh xung đột
      if (justChecked) return;
      
      // Ngăn chặn xử lý mặc định
      e.preventDefault();
      
      // Nếu đang hiển thị đáp án, nhấn Enter để chuyển câu tiếp theo
      if (showAnswer) {
        if (currentQuestionIndex < questions.length - 1) {
          nextQuestion();
        } else {
          // Nếu là câu cuối, nộp bài
          handleSubmitExam();
        }
        return;
      }
      
      // Nếu chưa hiển thị đáp án, nhấn Enter để kiểm tra
      if (!showAnswer) {
        // Kiểm tra xem có đáp án chưa
        const hasAnswer = currentQuestion.options.length > 0 
          ? selectedAnswer 
          : userAnswers[currentQuestionIndex]?.trim();
        
        if (hasAnswer) {
          handleSubmitAnswer();
        }
      }
    };

    // Thêm event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup khi component unmount hoặc dependencies thay đổi
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [examMode, questions, currentQuestionIndex, showAnswer, selectedAnswer, userAnswers, justChecked]);

  // Auto focus vào textarea khi chuyển đến câu hỏi tự luận
  useEffect(() => {
    if (examMode === 'exam' && questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion && currentQuestion.options.length === 0 && !showAnswer) {
        // Delay nhỏ để đảm bảo DOM đã được render
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      }
    }
  }, [examMode, questions, currentQuestionIndex, showAnswer]);

  // Lọc từ vựng theo level đã chọn và firebase_uid
  const getFilteredWords = () => {
    return words.filter(word => {
      const level = word.level_en || 0;
      return examSettings.selectedLevels.includes(level) && word.firebase_uid === user?.uid;
    });
  };

  // Đếm từ vựng theo level và firebase_uid
  const getWordsByLevel = () => {
    const levelCounts: { [key: number]: number } = {};
    words.forEach(word => {
      if (word.firebase_uid === user?.uid) {
        const level = word.level_en || 0;
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      }
    });
    return levelCounts;
  };

  // Toggle level selection
  const toggleLevel = (level: number) => {
    setExamSettings(prev => ({
      ...prev,
      selectedLevels: prev.selectedLevels.includes(level)
        ? prev.selectedLevels.filter(l => l !== level)
        : [...prev.selectedLevels, level]
    }));
  };

  // Toggle question type
  const toggleQuestionType = (type: keyof ExamSettings['questionTypes']) => {
    setExamSettings(prev => ({
      ...prev,
      questionTypes: {
        ...prev.questionTypes,
        [type]: !prev.questionTypes[type]
      }
    }));
  };

  // Toggle language
  const toggleLanguage = (lang: keyof ExamSettings['languages']) => {
    setExamSettings(prev => ({
      ...prev,
      languages: {
        ...prev.languages,
        [lang]: !prev.languages[lang]
      }
    }));
  };

  const generateExam = async () => {
    if (!user?.uid) {
      setError('Bạn cần đăng nhập để sử dụng tính năng này');
      return;
    }

    const filteredWords = getFilteredWords();
    if (filteredWords.length < 3) {
      setError('Bạn cần có ít nhất 3 từ vựng ở các level đã chọn để làm bài kiểm tra');
      return;
    }

    // Kiểm tra có ít nhất 1 loại câu hỏi được chọn
    const selectedQuestionTypes = Object.values(examSettings.questionTypes).filter(Boolean);
    if (selectedQuestionTypes.length === 0) {
      setError('Bạn cần chọn ít nhất 1 loại câu hỏi');
      return;
    }

    // Kiểm tra có ít nhất 1 ngôn ngữ được chọn
    const selectedLanguages = Object.values(examSettings.languages).filter(Boolean);
    if (selectedLanguages.length === 0) {
      setError('Bạn cần chọn ít nhất 1 ngôn ngữ');
      return;
    }

    setIsGeneratingQuestions(true);
    setError(null);

    try {
      // Không cắt bớt số từ nữa, lấy hết filteredWords
      const selectedWords = filteredWords;
      
      // Call API to generate questions
      const response = await fetch('/api/learning/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user.uid
        },
        body: JSON.stringify({ 
          words: selectedWords,
          settings: examSettings
        })
      });
      
      const data = await response.json();
      
      if (!data.questions || !Array.isArray(data.questions)) {
        setError('Không thể tạo câu hỏi. Vui lòng thử lại sau.');
        return;
      }
      
      setQuestions(data.questions);
      setUserAnswers(new Array(data.questions.length).fill(''));
      setCurrentQuestionIndex(0);
      // Set selectedAnswer dựa trên loại câu hỏi đầu tiên
      if (data.questions.length > 0 && data.questions[0].options.length > 0) {
        setSelectedAnswer(null); // Câu hỏi trắc nghiệm/đúng sai
      } else {
        setSelectedAnswer(null); // Câu hỏi tự luận
      }
      // Reset các state mới
      setAnsweredQuestions(new Set());
      setShowAnswer(false);
      setCurrentAnswerCorrect(null);
      setJustChecked(false);
      setExamMode('exam');
    } catch (err) {
      console.error('Error generating exam:', err);
      setError('Đã xảy ra lỗi khi tạo bài kiểm tra. Vui lòng thử lại sau.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAnswerSelection = (option: string) => {
    setSelectedAnswer(option);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers);
  };

  const handleEssayAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleDontKnow = () => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = 'Không biết';
    setUserAnswers(newAnswers);
    
    // Đánh dấu câu hỏi đã trả lời
    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    
    // Hiển thị đáp án
    setShowAnswer(true);
    setCurrentAnswerCorrect(false);
  };

  const handleSubmitAnswer = () => {
    const currentAnswer = userAnswers[currentQuestionIndex];
    if (!currentAnswer || currentAnswer.trim() === '') return;
    
    // Kiểm tra đáp án
    const question = questions[currentQuestionIndex];
    let isCorrect = false;
    
    if (question.options.length > 0) {
      // Câu hỏi trắc nghiệm hoặc đúng/sai
      isCorrect = question.answerIndex !== undefined 
        ? currentAnswer === question.options[question.answerIndex]
        : currentAnswer === question.correctAnswer;
    } else {
      // Câu hỏi tự luận - so sánh linh hoạt
      const userAnswer = currentAnswer.trim().toLowerCase();
      const correctAnswer = question.correctAnswer.trim().toLowerCase();
      
      // Loại bỏ dấu tiếng Việt để so sánh
      const removeDiacritics = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      };
      
      const userAnswerNoDiacritics = removeDiacritics(userAnswer);
      const correctAnswerNoDiacritics = removeDiacritics(correctAnswer);
      
      // Kiểm tra trùng khớp chính xác hoặc không dấu
      isCorrect = userAnswer === correctAnswer || 
                 userAnswerNoDiacritics === correctAnswerNoDiacritics ||
                 userAnswer.includes(correctAnswer) ||
                 correctAnswer.includes(userAnswer);
    }
    
    // Đánh dấu câu hỏi đã trả lời
    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    
    // Hiển thị đáp án
    setShowAnswer(true);
    setCurrentAnswerCorrect(isCorrect);
    setJustChecked(true);
    
    // Reset justChecked sau 500ms
    setTimeout(() => {
      setJustChecked(false);
    }, 500);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      const nextQuestion = questions[currentQuestionIndex + 1];
      if (nextQuestion.options.length > 0) {
        setSelectedAnswer(userAnswers[currentQuestionIndex + 1] || null);
      } else {
        setSelectedAnswer(null);
      }
      
      // Reset trạng thái hiển thị đáp án
      setShowAnswer(false);
      setCurrentAnswerCorrect(null);
      setJustChecked(false);
      
      // Auto focus vào textarea nếu câu tiếp theo là tự luận
      if (nextQuestion.options.length === 0) {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      }
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQuestion = questions[currentQuestionIndex - 1];
      if (prevQuestion.options.length > 0) {
        setSelectedAnswer(userAnswers[currentQuestionIndex - 1] || null);
      } else {
        setSelectedAnswer(null);
      }
      
      // Reset trạng thái hiển thị đáp án
      setShowAnswer(false);
      setCurrentAnswerCorrect(null);
      setJustChecked(false);
      
      // Auto focus vào textarea nếu câu trước là tự luận
      if (prevQuestion.options.length === 0) {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      }
    }
  };

  const handleSubmitExam = () => {
    let correctCount = 0;
    const details = userAnswers.map((answer, index) => {
      const question = questions[index];
      let isCorrect = false;
      
      // Kiểm tra dựa trên loại câu hỏi
      if (question.options.length > 0) {
        // Câu hỏi trắc nghiệm hoặc đúng/sai
        isCorrect = question.answerIndex !== undefined 
          ? answer === question.options[question.answerIndex]
          : answer === question.correctAnswer;
      } else {
        // Câu hỏi tự luận - so sánh linh hoạt
        const userAnswer = (answer || '').trim().toLowerCase();
        const correctAnswer = question.correctAnswer.trim().toLowerCase();
        
        // Loại bỏ dấu tiếng Việt để so sánh
        const removeDiacritics = (str: string) => {
          return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        };
        
        const userAnswerNoDiacritics = removeDiacritics(userAnswer);
        const correctAnswerNoDiacritics = removeDiacritics(correctAnswer);
        
        // Kiểm tra trùng khớp chính xác hoặc không dấu
        isCorrect = userAnswer === correctAnswer || 
                   userAnswerNoDiacritics === correctAnswerNoDiacritics ||
                   userAnswer.includes(correctAnswer) ||
                   correctAnswer.includes(userAnswer);
      }
      
      if (isCorrect) correctCount++;
      
      return {
        questionIndex: index,
        question: question.question,
        userAnswer: answer || 'Không trả lời',
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    const accuracy = (correctCount / questions.length) * 100;
    let grade = 'F';
    if (accuracy >= 90) grade = 'A';
    else if (accuracy >= 80) grade = 'B';
    else if (accuracy >= 70) grade = 'C';
    else if (accuracy >= 60) grade = 'D';

    const result: ExamResult = {
      score: correctCount,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      wrongAnswers: questions.length - correctCount,
      accuracy,
      grade,
      details
    };

    setExamResult(result);
    setExamMode('results');
    
    // Lưu lịch sử bài kiểm tra
    saveExamHistory(result);
  };

  const restartExam = () => {
    setExamMode('setup');
    setQuestions([]);
    setUserAnswers([]);
    setSelectedAnswer(null);
    setCurrentQuestionIndex(0);
    setExamResult(null);
    setAnsweredQuestions(new Set());
    setShowAnswer(false);
    setCurrentAnswerCorrect(null);
    setJustChecked(false);
  };

  // Hàm lưu lịch sử bài kiểm tra
  const saveExamHistory = async (result: ExamResult) => {
    if (!user?.uid) return;
    
    try {
      await fetch('/api/exam/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user.uid
        },
        body: JSON.stringify({
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          wrongAnswers: result.wrongAnswers,
          accuracy: result.accuracy,
          grade: result.grade,
          settings: examSettings,
          details: result.details
        })
      });
    } catch (error) {
      console.error('Error saving exam history:', error);
    }
  };

  // Hàm lấy lịch sử bài kiểm tra
  const fetchExamHistory = async () => {
    if (!user?.uid) return;
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/exam/history', {
        headers: {
          'firebase_uid': user.uid
        },
        cache: 'no-store'
      });
      const data = await response.json();
      setExamHistory(data);
    } catch (error) {
      console.error('Error fetching exam history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Hàm mở modal lịch sử
  const openHistory = () => {
    setShowHistory(true);
    fetchExamHistory();
  };

  // Hàm đóng modal lịch sử
  const closeHistory = () => {
    setShowHistory(false);
    setSelectedHistory(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  // Hàm tính toán thanh tiến trình với màu đỏ cho câu sai
  const getProgressBarSegments = () => {
    const segments = [];
    let correctCount = 0;
    let wrongCount = 0;
    
    for (let i = 0; i < questions.length; i++) {
      if (answeredQuestions.has(i)) {
        const answer = userAnswers[i];
        const question = questions[i];
        let isCorrect = false;
        
        if (question.options.length > 0) {
          isCorrect = question.answerIndex !== undefined 
            ? answer === question.options[question.answerIndex]
            : answer === question.correctAnswer;
        } else {
          const userAnswer = (answer || '').trim().toLowerCase();
          const correctAnswer = question.correctAnswer.trim().toLowerCase();
          const removeDiacritics = (str: string) => {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          };
          const userAnswerNoDiacritics = removeDiacritics(userAnswer);
          const correctAnswerNoDiacritics = removeDiacritics(correctAnswer);
          isCorrect = userAnswer === correctAnswer || 
                     userAnswerNoDiacritics === correctAnswerNoDiacritics ||
                     userAnswer.includes(correctAnswer) ||
                     correctAnswer.includes(userAnswer);
        }
        
        if (isCorrect) {
          correctCount++;
          segments.push({ type: 'correct', count: 1 });
        } else {
          wrongCount++;
          segments.push({ type: 'wrong', count: 1 });
        }
      } else {
        segments.push({ type: 'unanswered', count: 1 });
      }
    }
    
    return { segments, correctCount, wrongCount };
  };

  const filteredWords = getFilteredWords();
  const wordsByLevel = getWordsByLevel();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full h-screen bg-dark-900 flex items-center justify-center p-0 sm:p-0">
        <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Content area với kích thước cố định */}
            <div className="flex-1 overflow-hidden">
              {/* Header với icon lịch sử */}
              <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gradient-to-r from-primary-200/10 to-secondary-200/10">
                <div>
                  <h1 className="text-3xl font-bold text-primary-200 mb-1 drop-shadow">Bài Kiểm Tra Từ Vựng</h1>
                  <p className="text-base text-gray-400">Kiểm tra kiến thức từ vựng của bạn</p>
                </div>
                <button
                  onClick={openHistory}
                  className="flex items-center px-5 py-2 bg-gradient-to-r from-primary-200 to-secondary-200 text-gray-900 font-semibold rounded-xl shadow hover:from-primary-300 hover:to-secondary-300 transition-all"
                >
                  <MdHistory className="w-6 h-6 mr-2 text-gray-800" />
                  <span className="hidden sm:inline">Lịch sử</span>
                </button>
              </div>
              {error && (
                <div className="bg-error-200/10 border-l-4 border-error-200 p-4 m-4 rounded-xl">
                  <p className="text-error-200 text-base">{error}</p>
                </div>
              )}
              {examMode === 'setup' && (
                <div className="h-full overflow-y-auto p-8">
                  <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <MdSchool className="w-10 h-10 text-gray-800" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-50 mb-3">Thiết lập bài kiểm tra</h2>
                  </div>
                  {/* Chọn level từ vựng */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-primary-200 mb-4 flex items-center">
                      <MdTrendingUp className="w-6 h-6 mr-2 text-primary-200" />
                      Chọn level từ vựng
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {[0, 1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          onClick={() => toggleLevel(level)}
                          className={`p-4 rounded-2xl border-2 font-semibold text-lg transition-all shadow-lg ${
                            examSettings.selectedLevels.includes(level)
                              ? 'border-primary-200 bg-primary-200/20 text-primary-200 scale-105'
                              : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-primary-200 hover:bg-primary-200/10'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-bold">Level {level}</div>
                            <div className="text-sm text-gray-400">{wordsByLevel[level] || 0} từ</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Chọn loại câu hỏi */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-success-200 mb-4 flex items-center">
                      <MdCheckBox className="w-6 h-6 mr-2 text-success-200" />
                      Loại câu hỏi
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => toggleQuestionType('multipleChoice')}
                        className={`p-5 rounded-2xl border-2 font-semibold transition-all shadow-lg text-left ${
                          examSettings.questionTypes.multipleChoice
                            ? 'border-success-200 bg-success-200/20 text-success-200 scale-105'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-success-200 hover:bg-success-200/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span>Trắc nghiệm</span>
                          {examSettings.questionTypes.multipleChoice ? (
                            <MdCheckBox className="w-6 h-6 text-success-200" />
                          ) : (
                            <MdCheckBoxOutlineBlank className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm">Chọn đáp án đúng từ 4 lựa chọn</p>
                      </button>
                      <button
                        onClick={() => toggleQuestionType('trueFalse')}
                        className={`p-5 rounded-2xl border-2 font-semibold transition-all shadow-lg text-left ${
                          examSettings.questionTypes.trueFalse
                            ? 'border-success-200 bg-success-200/20 text-success-200 scale-105'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-success-200 hover:bg-success-200/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span>Đúng/Sai</span>
                          {examSettings.questionTypes.trueFalse ? (
                            <MdCheckBox className="w-6 h-6 text-success-200" />
                          ) : (
                            <MdCheckBoxOutlineBlank className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm">Chọn đúng hoặc sai</p>
                      </button>
                      <button
                        onClick={() => toggleQuestionType('essay')}
                        className={`p-5 rounded-2xl border-2 font-semibold transition-all shadow-lg text-left ${
                          examSettings.questionTypes.essay
                            ? 'border-success-200 bg-success-200/20 text-success-200 scale-105'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-success-200 hover:bg-success-200/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span>Tự luận</span>
                          {examSettings.questionTypes.essay ? (
                            <MdCheckBox className="w-6 h-6 text-success-200" />
                          ) : (
                            <MdCheckBoxOutlineBlank className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm">Viết câu trả lời tự do</p>
                      </button>
                    </div>
                  </div>
                  {/* Chọn ngôn ngữ */}
                  <div className="mb-10">
                    <h3 className="text-lg font-semibold text-secondary-200 mb-4 flex items-center">
                      <MdLanguage className="w-6 h-6 mr-2 text-secondary-200" />
                      Ngôn ngữ trả lời
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => toggleLanguage('english')}
                        className={`p-5 rounded-2xl border-2 font-semibold transition-all shadow-lg text-left ${
                          examSettings.languages.english
                            ? 'border-secondary-200 bg-secondary-200/20 text-secondary-200 scale-105'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-secondary-200 hover:bg-secondary-200/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span>Tiếng Anh</span>
                          {examSettings.languages.english ? (
                            <MdCheckBox className="w-6 h-6 text-secondary-200" />
                          ) : (
                            <MdCheckBoxOutlineBlank className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm">Câu hỏi và trả lời bằng tiếng Anh</p>
                      </button>
                      <button
                        onClick={() => toggleLanguage('vietnamese')}
                        className={`p-5 rounded-2xl border-2 font-semibold transition-all shadow-lg text-left ${
                          examSettings.languages.vietnamese
                            ? 'border-secondary-200 bg-secondary-200/20 text-secondary-200 scale-105'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-secondary-200 hover:bg-secondary-200/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span>Tiếng Việt</span>
                          {examSettings.languages.vietnamese ? (
                            <MdCheckBox className="w-6 h-6 text-secondary-200" />
                          ) : (
                            <MdCheckBoxOutlineBlank className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm">Câu hỏi và trả lời bằng tiếng Việt</p>
                      </button>
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={generateExam}
                      disabled={isGeneratingQuestions || filteredWords.length < 3}
                      className="inline-flex items-center px-10 py-4 bg-gradient-to-r from-primary-200 to-secondary-200 text-gray-900 font-bold rounded-2xl shadow-lg hover:from-primary-300 hover:to-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-all"
                    >
                      {isGeneratingQuestions ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                          Đang tạo bài kiểm tra...
                        </>
                      ) : (
                        <>
                          <MdPlayArrow className="w-6 h-6 mr-2" />
                          Bắt đầu làm bài kiểm tra
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {examMode === 'exam' && questions.length > 0 && (
                <div className="h-full flex flex-col">
                  {/* Header with timer and progress */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 flex-shrink-0">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                      <div className="bg-white bg-opacity-20 px-3 py-1 sm:px-4 sm:py-2 rounded-full">
                        <span className="font-semibold text-sm sm:text-base">
                          Câu {currentQuestionIndex + 1}/{questions.length}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm">
                        <span className="bg-green-500 bg-opacity-20 px-2 py-1 sm:px-3 sm:py-1 rounded mr-2 sm:mr-3">
                          Đúng: {getProgressBarSegments().correctCount}
                        </span>
                        <span className="bg-red-500 bg-opacity-20 px-2 py-1 sm:px-3 sm:py-1 rounded">
                          Sai: {getProgressBarSegments().wrongCount}
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-2 sm:h-3 flex overflow-hidden">
                      {getProgressBarSegments().segments.map((segment, index) => (
                        <div
                          key={index}
                          className={`h-full transition-all duration-300 ${
                            segment.type === 'correct' 
                              ? 'bg-green-400' 
                              : segment.type === 'wrong' 
                                ? 'bg-red-400' 
                                : 'bg-white bg-opacity-30'
                          }`}
                          style={{ width: `${(1 / questions.length) * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Question content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {questions[currentQuestionIndex] && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">
                          {questions[currentQuestionIndex].question}
                        </h3>
                        
                        {/* Hiển thị options cho trắc nghiệm và đúng/sai */}
                        {questions[currentQuestionIndex].options.length > 0 && (
                          <div className="space-y-3 mb-8">
                            {questions[currentQuestionIndex].options.map((option, index) => (
                              <div 
                                key={index}
                                onClick={() => !showAnswer && handleAnswerSelection(option)}
                                className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                                  selectedAnswer === option 
                                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                } ${showAnswer ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                <div className="flex items-center">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                                    selectedAnswer === option 
                                      ? 'border-blue-500 bg-blue-500 text-white' 
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedAnswer === option && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <span className="font-medium">
                                    {index + 1}. {String.fromCharCode(65 + index)}.
                                  </span>
                                  <span className="ml-2">{option}</span>
                                  {showAnswer && option === questions[currentQuestionIndex].correctAnswer && (
                                    <span className="ml-auto text-green-600 font-bold">✓</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Hiển thị input cho câu hỏi tự luận */}
                        {questions[currentQuestionIndex].options.length === 0 && (
                          <div className="mb-8">
                            <div className="bg-gray-50 border-l-4 border-blue-400 p-4 mb-4">
                              <p className="text-sm text-blue-700">
                                <strong>Lưu ý:</strong> Đây là câu hỏi tự luận. Hãy nhập đáp án của bạn vào ô bên dưới.
                              </p>
                            </div>
                            <textarea
                              ref={textareaRef}
                              value={userAnswers[currentQuestionIndex] || ''}
                              onChange={(e) => !showAnswer && handleEssayAnswer(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  e.stopPropagation(); // Ngăn event bubble lên
                                  const hasAnswer = userAnswers[currentQuestionIndex]?.trim();
                                  if (hasAnswer && !showAnswer) {
                                    // Thêm delay nhỏ để tránh xung đột
                                    setTimeout(() => {
                                      handleSubmitAnswer();
                                    }, 10);
                                  }
                                }
                              }}
                              placeholder="Nhập đáp án của bạn..."
                              className={`w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                                showAnswer ? 'bg-gray-100' : ''
                              }`}
                              rows={4}
                              disabled={showAnswer}
                            />
                          </div>
                        )}
                        
                        {/* Thông báo hướng dẫn phím Enter */}
                        {!showAnswer && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                            <p className="text-sm text-blue-700">
                              <strong>Mẹo:</strong> 
                              {questions[currentQuestionIndex].options.length > 0 ? (
                                <>
                                  Nhấn <span className="font-mono bg-blue-200 px-1 rounded">1, 2, 3, 4</span> để chọn đáp án hoặc{' '}
                                  <span className="font-mono bg-blue-200 px-1 rounded">Enter</span> để kiểm tra
                                </>
                              ) : (
                                <>
                                  Nhấn <span className="font-mono bg-blue-200 px-1 rounded">Enter</span> để kiểm tra đáp án 
                                  <span> (hoặc nhấn Enter trong ô nhập)</span>
                                </>
                              )}
                            </p>
                          </div>
                        )}
                        
                        {showAnswer && (
                          <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4">
                            <p className="text-sm text-green-700">
                              <strong>Mẹo:</strong> Nhấn <span className="font-mono bg-green-200 px-1 rounded">Enter</span> để chuyển câu tiếp theo
                            </p>
                          </div>
                        )}
                        
                        {/* Hiển thị đáp án sau khi trả lời */}
                        {showAnswer && (
                          <div className={`p-4 mb-6 rounded-lg border-l-4 ${
                            currentAnswerCorrect 
                              ? 'bg-green-50 border-green-400 text-green-800' 
                              : 'bg-red-50 border-red-400 text-red-800'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">
                                {currentAnswerCorrect ? 'Chính xác! 🎉' : 'Chưa đúng 😔'}
                              </span>
                              {currentAnswerCorrect ? (
                                <span className="text-2xl">✅</span>
                              ) : (
                                <span className="text-2xl">❌</span>
                              )}
                            </div>
                            <p className="mb-2">
                              <strong>Đáp án của bạn:</strong> {userAnswers[currentQuestionIndex] || 'Không trả lời'}
                            </p>
                            <p>
                              <strong>Đáp án đúng:</strong> {questions[currentQuestionIndex].correctAnswer}
                            </p>
                          </div>
                        )}
                        
                        {/* Nút điều khiển */}
                        <div className="flex justify-between items-center">
                          <button
                            onClick={previousQuestion}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <MdArrowBack className="w-5 h-5 mr-2" />
                            Câu trước
                          </button>
                          
                          <div className="flex gap-3">
                            {/* Nút "Không biết" */}
                            {!showAnswer && (
                              <button
                                onClick={handleDontKnow}
                                className="flex items-center px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                              >
                                <MdCancel className="w-5 h-5 mr-2" />
                                Không biết
                              </button>
                            )}
                            
                            {/* Nút "Kiểm tra" hoặc "Câu tiếp theo" */}
                            {!showAnswer ? (
                              <button
                                onClick={handleSubmitAnswer}
                                disabled={questions[currentQuestionIndex].options.length > 0 ? !selectedAnswer : !userAnswers[currentQuestionIndex]?.trim()}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <MdCheckCircle className="w-5 h-5 mr-2" />
                                Kiểm tra
                              </button>
                            ) : (
                              <button
                                onClick={nextQuestion}
                                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Câu tiếp theo
                                <MdArrowForward className="w-5 h-5 ml-2" />
                              </button>
                            )}
                          </div>
                          
                          {/* Nút "Nộp bài" chỉ hiển thị ở câu cuối */}
                          {currentQuestionIndex === questions.length - 1 && showAnswer && (
                            <button
                              onClick={handleSubmitExam}
                              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Nộp bài
                              <MdCheckCircle className="w-5 h-5 ml-2" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {examMode === 'results' && examResult && (
                <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
                  <div className="text-center mb-6 sm:mb-8">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 ${getGradeColor(examResult.grade)}`}>
                      <MdGrade className="w-10 h-10 sm:w-12 sm:h-12" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-3">Kết Quả Bài Kiểm Tra</h2>
                    <p className="text-sm sm:text-base text-gray-600">Chúc mừng bạn đã hoàn thành bài kiểm tra!</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-green-50 rounded-lg p-4 sm:p-6 text-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <MdCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">Đúng</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{examResult.correctAnswers}</p>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4 sm:p-6 text-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <MdCancel className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">Sai</p>
                      <p className="text-xl sm:text-2xl font-bold text-red-600">{examResult.wrongAnswers}</p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 sm:p-6 text-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <MdTrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">Tỷ lệ chính xác</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{Number(examResult.accuracy).toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="mb-6 sm:mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Chi tiết từng câu:</h4>
                    <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                      {examResult.details.map((detail, index) => (
                        <div 
                          key={index}
                          className={`p-3 sm:p-4 rounded-lg border-l-4 ${
                            detail.isCorrect 
                              ? 'bg-green-50 border-green-400 text-green-800' 
                              : 'bg-red-50 border-red-400 text-red-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm sm:text-base">
                              <strong>Câu {index + 1}:</strong> {detail.userAnswer}
                            </div>
                            <div className="flex items-center">
                              {detail.isCorrect ? (
                                <MdCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                              ) : (
                                <MdCancel className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                              )}
                            </div>
                          </div>
                          {!detail.isCorrect && (
                            <p className="mt-1 text-xs sm:text-sm opacity-75">
                              Đáp án đúng: {detail.correctAnswer}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={restartExam}
                      className="inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-base sm:text-lg"
                    >
                      <MdRefresh className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                      Làm bài kiểm tra khác
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lịch sử bài kiểm tra */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Lịch sử bài kiểm tra</h2>
              <button
                onClick={closeHistory}
                className="text-gray-500 hover:text-gray-700"
              >
                <MdCancel className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingHistory ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Đang tải lịch sử...</p>
                </div>
              ) : (Array.isArray(examHistory) ? examHistory : []).length === 0 ? (
                <div className="p-8 text-center">
                  <MdHistory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chưa có lịch sử bài kiểm tra nào</p>
                </div>
              ) : selectedHistory ? (
                // Chi tiết bài kiểm tra
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <button
                      onClick={() => setSelectedHistory(null)}
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <MdArrowBack className="w-5 h-5 mr-2" />
                      Quay lại danh sách
                    </button>
                    <div className={`px-4 py-2 rounded-full text-white font-bold ${getGradeColor(selectedHistory.grade)}`}>
                      {selectedHistory.grade}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MdCheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-600">Đúng</p>
                      <p className="text-xl font-bold text-green-600">{selectedHistory.correct_answers}</p>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MdCancel className="w-6 h-6 text-red-600" />
                      </div>
                      <p className="text-sm text-gray-600">Sai</p>
                      <p className="text-xl font-bold text-red-600">{selectedHistory.wrong_answers}</p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MdTrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600">Tỷ lệ chính xác</p>
                      <p className="text-xl font-bold text-blue-600">{Number(selectedHistory.accuracy).toFixed(1)}%</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MdAccessTime className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-600">Ngày làm</p>
                      <p className="text-sm font-bold text-gray-600">
                        {new Date(selectedHistory.exam_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Chi tiết từng câu:</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedHistory.details.map((detail: any, index: number) => (
                        <div 
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            detail.isCorrect 
                              ? 'bg-green-50 border-green-400' 
                              : 'bg-red-50 border-red-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800">
                              Câu {index + 1}
                            </span>
                            {detail.isCorrect ? (
                              <MdCheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <MdCancel className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          
                          {detail.isCorrect ? (
                            <p className="text-green-700">
                              <strong>Đáp án:</strong> {detail.userAnswer}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-gray-800 font-medium">
                                <strong>Câu hỏi:</strong> {detail.question || 'N/A'}
                              </p>
                              <p className="text-red-700">
                                <strong>Đáp án của bạn:</strong> {detail.userAnswer}
                              </p>
                              <p className="text-green-700">
                                <strong>Đáp án đúng:</strong> {detail.correctAnswer}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Danh sách bài kiểm tra
                <div className="p-6">
                  <div className="space-y-4">
                    {(Array.isArray(examHistory) ? examHistory : []).map((history, index) => (
                      <div 
                        key={history.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedHistory(history)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getGradeColor(history.grade)}`}>
                              <MdGrade className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                Bài kiểm tra #{history.id}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(history.exam_date).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Đúng</p>
                                <p className="font-bold text-green-600">{history.correct_answers}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Sai</p>
                                <p className="font-bold text-red-600">{history.wrong_answers}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600">Tỷ lệ</p>
                                <p className="font-bold text-blue-600">{Number(history.accuracy).toFixed(1)}%</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-white font-bold ${getGradeColor(history.grade)}`}>
                                {history.grade}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ExamPage; 