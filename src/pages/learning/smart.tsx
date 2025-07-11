import { useState, useEffect, useRef, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

// Định nghĩa các trạng thái của phiên học
enum SessionState {
  LOADING = 'loading',
  READY = 'ready',
  LEARNING = 'learning',
  FINISHED = 'finished'
}

// Định nghĩa cấu trúc của từ vựng
interface Term {
  id: number;
  vocab: string;
  meanings: string | string[];
  example_sentence?: string;
  notes?: string;
  level_en: number;
  level_vi: number;
  review_time_en: string | null; // yyyy-mm-dd
  review_time_vi: string | null; // yyyy-mm-dd
  last_review_en: number | null;
  last_review_vi: number | null;
  created_at: string;
  updated_at: string;
}

// Định nghĩa lượt học (từ + chiều)
interface LearningItem {
  term: Term;
  mode: 'en_to_vi' | 'vi_to_en';
}

// Thêm interface cho thông tin học tiếp theo
interface NextLearningInfo {
  nextLearningDate?: string;
  nextLearningCount?: number;
  daysUntilNext?: number;
}

// Hàm loại bỏ dấu tiếng Việt
function removeDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (match) => match === 'đ' ? 'd' : 'D');
}

// Hàm chuẩn hóa đáp án để so sánh
function normalizeForComparison(text: string): string {
  return removeDiacritics(text.toLowerCase().trim());
}

// Hàm lấy ngày hiện tại theo GMT+7
function getTodayStrGMT7() {
  const now = new Date();
  // GMT+7 offset = 7*60 = 420 phút
  const gmt7 = new Date(now.getTime() + (7 * 60 - now.getTimezoneOffset()) * 60000);
  return gmt7.toISOString().slice(0, 10);
}

// Hàm xử lý an toàn cho trường meanings
function safeMeanings(meanings: string | string[] | undefined): string {
  if (!meanings) return '';
  if (Array.isArray(meanings)) return meanings.join(', ');
  return meanings;
}

// Hàm xáo trộn mảng (thuật toán Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const SmartLearningPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.LOADING);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Thêm một ref để theo dõi trạng thái hiển thị kết quả
  const showingResultRef = useRef<boolean>(false);
  // Thêm state để kiểm soát chế độ học ngẫu nhiên
  const [randomMode, setRandomMode] = useState<boolean>(true);
  // Thêm state để lưu số lượng từ vựng
  const [termsCount, setTermsCount] = useState<number>(0);
  // Thêm state để lưu thông tin học tiếp theo
  const [nextLearningInfo, setNextLearningInfo] = useState<NextLearningInfo | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchLearningItems();
    }
  }, [user]);

  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        
        if (sessionState === SessionState.READY && learningItems.length > 0) {
          startLearning();
        } else if (sessionState === SessionState.FINISHED) {
          fetchLearningItems();
        } else if (sessionState === SessionState.LEARNING && showingResultRef.current) {
          nextTerm();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [sessionState, learningItems.length, showingResultRef.current]);

  // Lấy danh sách các lượt học từ API
  const fetchLearningItems = async () => {
    setSessionState(SessionState.LOADING);
    setError(null);
    
    try {
      if (!user || !user.uid) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch(`/api/learning/smart?mode=both`, {
        headers: {
          'firebase_uid': user.uid,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.learningList && data.learningList.length > 0) {
        // Nếu chế độ random được bật, xáo trộn danh sách
        const itemsToSet = randomMode 
          ? shuffleArray(data.learningList) 
          : data.learningList;
          
        setLearningItems(itemsToSet);
        // Lưu số lượng từ vựng
        setTermsCount(data.termsCount || 0);
        // Reset thông tin học tiếp theo
        setNextLearningInfo(null);
        console.log('Số lượt học cần làm hôm nay:', itemsToSet.length);
        console.log('Số từ vựng cần học:', data.termsCount || 0);
        console.log('Chi tiết từng lượt học:', itemsToSet);
        setSessionState(SessionState.READY);
      } else {
        setLearningItems([]);
        setTermsCount(0);
        // Lưu thông tin học tiếp theo
        setNextLearningInfo({
          nextLearningDate: data.nextLearningDate,
          nextLearningCount: data.nextLearningCount,
          daysUntilNext: data.daysUntilNext
        });
        setSessionState(SessionState.FINISHED);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu học tập:', error);
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải dữ liệu học tập');
      setSessionState(SessionState.FINISHED);
    }
  };

  const startLearning = () => {
    console.log('Danh sách lượt học sẽ học:', learningItems);
    if (learningItems.length > 0) {
      setSessionState(SessionState.LEARNING);
      setCurrentIndex(0);
      setStats({ correct: 0, total: 0 });
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const reshuffleItems = () => {
    if (learningItems.length > 0) {
      const shuffledItems = shuffleArray(learningItems);
      setLearningItems(shuffledItems);
      setCurrentIndex(0);
      setUserAnswer('');
      setIsAnswerCorrect(null);
      showingResultRef.current = false;
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleAnswer = async () => {
    if (userAnswer.trim().length === 0) return;
    
    const currentItem = learningItems[currentIndex];
    if (!currentItem) return;
    
    let isCorrect = false;
    
    if (currentItem.mode === 'en_to_vi') {
      const correctAnswers = Array.isArray(currentItem.term.meanings)
        ? currentItem.term.meanings
        : [currentItem.term.meanings];
      isCorrect = (correctAnswers as string[]).some((correctAnswer: string) =>
        normalizeForComparison(correctAnswer) === normalizeForComparison(userAnswer)
      );
        } else {
      isCorrect = normalizeForComparison(currentItem.term.vocab) === normalizeForComparison(userAnswer);
    }
    
    setIsAnswerCorrect(isCorrect);
    setStats(prev => ({ ...prev, total: prev.total + 1, correct: isCorrect ? prev.correct + 1 : prev.correct }));
    
    showingResultRef.current = true;
    
    try {
      if (!user || !user.uid) {
        setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      const response = await fetch('/api/learning/update-level', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
            'firebase_uid': user.uid
        },
        body: JSON.stringify({
          term_id: currentItem.term.id,
            is_correct: isCorrect,
          mode: currentItem.mode
        })
      });
      
      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status} ${response.statusText}`);
      }
      
          const data = await response.json();
      console.log('Kết quả cập nhật level:', data);
      
      setLearningItems(prevItems => prevItems.map((item, idx) => {
        if (idx === currentIndex) {
          const updatedTerm = { ...item.term };
          
          if (item.mode === 'en_to_vi' && data.field_updated === 'level_en') {
            updatedTerm.level_en = Math.max(0, data.new_level_en);
            updatedTerm.review_time_en = data.next_review_time_en;
          }
          
          if (item.mode === 'vi_to_en' && data.field_updated === 'level_vi') {
            updatedTerm.level_vi = Math.max(0, data.new_level_vi);
            updatedTerm.review_time_vi = data.next_review_time_vi;
          }
          
          return { ...item, term: updatedTerm };
            }
        return item;
          }));
    } catch (error) {
      console.error('Lỗi khi cập nhật level:', error);
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi cập nhật tiến độ học tập');
    }
  };

  const nextTerm = () => {
    if (currentIndex < learningItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
            setIsAnswerCorrect(null);
            setUserAnswer('');
      
      showingResultRef.current = false;
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
          } else {
            setSessionState(SessionState.FINISHED);
          }
  };

  const handleKeyPress = (e: ReactKeyboardEvent) => {
    if (e.key === 'Enter') {
          e.preventDefault();
      if (isAnswerCorrect === null) {
        handleAnswer();
      } else {
        nextTerm();
    }
      }
    };

  const getCurrentItem = () => {
    return learningItems[currentIndex];
  };

  const isCurrentItemNew = () => {
    const currentItem = getCurrentItem();
    if (!currentItem) return false;
    return currentItem.mode === 'en_to_vi' ? currentItem.term.level_en === 0 : currentItem.term.level_vi === 0;
  };

  const getCurrentItemLevel = () => {
    const currentItem = getCurrentItem();
    if (!currentItem) return 0;
    return currentItem.mode === 'en_to_vi' ? currentItem.term.level_en : currentItem.term.level_vi;
  };

  const getCurrentQuestion = () => {
    const currentItem = getCurrentItem();
    if (!currentItem) return '';
    
    if (currentItem.mode === 'en_to_vi') {
      return currentItem.term.vocab;
    } else {
      return safeMeanings(currentItem.term.meanings);
    }
  };

  const getCorrectAnswer = () => {
    const currentItem = getCurrentItem();
    if (!currentItem) return '';
    
    if (currentItem.mode === 'en_to_vi') {
      return safeMeanings(currentItem.term.meanings);
    } else {
      return currentItem.term.vocab;
    }
  };

  // Hàm format ngày tháng
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Trả về yyyy-mm-dd để luôn đồng nhất giữa server và client
    return new Date(dateString).toISOString().slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-gray-800 text-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Học thông minh</h1>
        
          {sessionState === SessionState.LOADING && (
        <div className="flex items-center justify-center min-h-[60vh] bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
            </div>
          )}
          
        {error && (
          <div className="bg-error-100 text-error-700 p-4 rounded-lg mb-6">
            <p className="font-semibold">Lỗi: {error}</p>
                    </div>
                  )}
        
        {sessionState === SessionState.READY && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-700 rounded-2xl shadow-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Sẵn sàng học</h2>
              
              {learningItems.length > 0 ? (
                <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-600 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-primary-200 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-gray-800 font-bold text-lg">{termsCount}</span>
                    </div>
                    <div>
                          <h3 className="text-gray-50 font-semibold">Từ vựng</h3>
                          <p className="text-gray-400 text-sm">Cần học hôm nay</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-600 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-secondary-200 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-gray-800 font-bold text-lg">{learningItems.length}</span>
                    </div>
                    <div>
                          <h3 className="text-gray-50 font-semibold">Lượt học</h3>
                          <p className="text-gray-400 text-sm">~{Math.ceil(learningItems.length * 0.8)} phút</p>
                    </div>
                  </div>
                </div>
              </div>
                  
                  <div className="bg-gray-600 rounded-xl p-4 mb-8">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={randomMode}
                          onChange={(e) => setRandomMode(e.target.checked)}
                          className="form-checkbox h-5 w-5 text-primary-200 rounded border-gray-500 focus:ring-primary-200 bg-gray-700"
                        />
                        <span className="ml-2 text-gray-200">Học ngẫu nhiên</span>
                      </label>
                      <div className="text-sm text-gray-400">
                        {randomMode ? 'Các từ sẽ được hiển thị theo thứ tự ngẫu nhiên' : 'Các từ sẽ hiển thị theo thứ tự cố định'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                      <button
                      onClick={startLearning}
                      className="px-8 py-4 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-xl font-bold text-lg hover:from-primary-300 hover:to-primary-400 transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Bắt đầu học ngay <span className="ml-2 text-sm opacity-70">(Enter)</span>
                      </button>
                        </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-xl text-gray-300 mb-6">Hiện tại bạn không có từ vựng cần ôn tập.</p>
                      <button
                    onClick={() => router.push('/learning')}
                    className="px-6 py-3 bg-gray-600 text-gray-50 rounded-lg font-semibold hover:bg-gray-500 transition-all duration-200"
                  >
                    Quay lại menu
                      </button>
                    </div>
              )}
                  </div>
            </div>
          )}
          
        {sessionState === SessionState.LEARNING && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-700 rounded-2xl shadow-2xl p-6 mb-6 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      getCurrentItem()?.mode === 'en_to_vi' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getCurrentItem()?.mode === 'en_to_vi' ? '🇺🇸 Anh → Việt' : '🇻🇳 Việt → Anh'}
                  </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isCurrentItemNew() ? 'bg-error-200 text-gray-800' : 'bg-secondary-200 text-gray-800'
                    }`}>
                      {isCurrentItemNew() ? '🆕 Từ mới' : `📊 Cấp ${getCurrentItemLevel()}`}
                  </span>
                </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Tiến độ</div>
                    <div className="text-lg font-bold text-gray-50">
                      {currentIndex + 1} / {learningItems.length}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Đúng</div>
                    <div className="text-lg font-bold text-success-200">
                      {stats.correct} / {stats.total}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-600 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary-200 to-primary-300 h-3 rounded-full transition-all duration-300"
                    style={{
                    width: `${((currentIndex + 1) / learningItems.length) * 100}%`,
                    }}
                  ></div>
              </div>

              {randomMode && (
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={reshuffleItems}
                    className="flex items-center px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm text-gray-300 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Xáo trộn lại
                  </button>
                  </div>
              )}
            </div>

            <div className="bg-gray-700 rounded-2xl shadow-2xl p-8 mb-6 border border-gray-600">
              <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-50 mb-4">
                    {getCurrentQuestion()}
                  </h2>
                  
                {getCurrentItem()?.mode === 'en_to_vi' && getCurrentItem()?.term.example_sentence && (
                    <div className="bg-gray-600 rounded-lg p-4 mb-6">
                    <p className="text-gray-300 italic text-lg">"{getCurrentItem()?.term.example_sentence}"</p>
                    </div>
                  )}
                </div>
                
              <div className="mb-6">
                <label className="block text-gray-300 mb-2 text-center">
                  {getCurrentItem()?.mode === 'en_to_vi' ? 'Nhập nghĩa tiếng Việt...' : 'Nhập từ tiếng Anh...'}
                </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isAnswerCorrect !== null}
                  className="w-full p-4 bg-gray-600 rounded-lg text-gray-50 text-xl text-center focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder={getCurrentItem()?.mode === 'en_to_vi' ? 'Nhập nghĩa tiếng Việt...' : 'Nhập từ tiếng Anh...'}
                />
                  </div>
                  
                  <div className="flex justify-center">
                {isAnswerCorrect === null ? (
                    <button
                      onClick={handleAnswer}
                    disabled={userAnswer.trim().length === 0}
                    className={`px-8 py-4 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-xl font-bold text-lg transition-all duration-200 ${
                      userAnswer.trim().length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:from-primary-300 hover:to-primary-400 transform hover:scale-105'
                    }`}
                  >
                    Kiểm tra <span className="ml-2 text-sm opacity-70">(Enter)</span>
                    </button>
                ) : (
                  <button
                    onClick={nextTerm}
                    className="px-8 py-4 bg-gradient-to-r from-secondary-200 to-secondary-300 text-gray-800 rounded-xl font-bold text-lg hover:from-secondary-300 hover:to-secondary-400 transition-all duration-200 transform hover:scale-105"
                  >
                    Tiếp tục <span className="ml-2 text-sm opacity-70">(Enter)</span>
                  </button>
                )}
                </div>
                
              {isAnswerCorrect !== null && (
                <div className="mt-8 bg-gray-600 rounded-xl p-6 border border-gray-500">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                      isAnswerCorrect ? 'bg-success-200' : 'bg-error-200'
                    }`}>
                      {isAnswerCorrect ? (
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-50">
                      {isAnswerCorrect ? 'Chính xác!' : 'Đáp án đúng:'}
                    </h3>
                      <p className="text-gray-400">Bạn đã trả lời {isAnswerCorrect ? 'đúng' : 'sai'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <p className="text-xl text-gray-50 font-medium">
                      {getCorrectAnswer()}
                    </p>
                  </div>
                  
                  {getCurrentItem()?.term.notes && (
                    <div className="bg-gray-700 rounded-lg p-4 mb-4">
                      <p className="text-gray-300 italic">💡 {getCurrentItem()?.term.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {sessionState === SessionState.FINISHED && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-700 rounded-2xl shadow-2xl p-8 mb-8">
              {learningItems.length > 0 ? (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-center">Hoàn thành phiên học</h2>
                  
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-600 rounded-xl p-6 text-center">
                      <div className="text-4xl font-bold text-primary-200 mb-2">{termsCount}</div>
                      <div className="text-gray-300">Từ vựng</div>
                    </div>
                    <div className="bg-gray-600 rounded-xl p-6 text-center">
                      <div className="text-4xl font-bold text-secondary-200 mb-2">{stats.total}</div>
                      <div className="text-gray-300">Lượt học</div>
                    </div>
                    <div className="bg-gray-600 rounded-xl p-6 text-center">
                      <div className="text-4xl font-bold text-success-200 mb-2">{stats.correct}</div>
                      <div className="text-gray-300">Đúng</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-600 rounded-xl p-6 text-center mb-8">
                    <div className="text-4xl font-bold text-secondary-200 mb-2">
                      {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                    </div>
                    <div className="text-gray-300">Tỷ lệ chính xác</div>
                  </div>
                  
                  <p className="text-gray-300 mb-8 text-lg text-center">
                    Bạn đã học thành công {termsCount} từ vựng ({stats.total} lượt học). Hệ thống đã ghi nhận và cập nhật tiến độ học tập của bạn.
                  </p>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => router.push('/learning')}
                      className="px-6 py-3 bg-gray-600 text-gray-50 rounded-lg font-semibold hover:bg-gray-500 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Quay lại menu
                    </button>
                    <button
                      onClick={fetchLearningItems}
                      className="px-6 py-3 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-lg font-semibold hover:from-primary-300 hover:to-primary-400 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Học lại <span className="ml-2 text-sm opacity-70">(Enter)</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-center">Không có từ vựng cần học</h2>
                  
                  {nextLearningInfo ? (
                    <div className="text-center">
                      <div className="bg-gray-600 rounded-xl p-8 mb-8">
                        <div className="text-6xl mb-4">🎉</div>
                        <h3 className="text-2xl font-bold text-gray-50 mb-4">Tuyệt vời!</h3>
                        <p className="text-xl text-gray-300 mb-6">
                          Bạn đã hoàn thành tất cả từ vựng cần học hôm nay.
                        </p>
                        
                        {nextLearningInfo.daysUntilNext === 0 ? (
                          <div className="bg-primary-200 rounded-lg p-4 mb-6">
                            <p className="text-gray-800 font-semibold text-lg">
                              Bạn có {nextLearningInfo.nextLearningCount} từ mới cần học!
                            </p>
                          </div>
                        ) : (
                          <div className="bg-secondary-200 rounded-lg p-4 mb-6">
                            <p className="text-gray-800 font-semibold text-lg">
                              {nextLearningInfo.daysUntilNext === 1 
                                ? `Ngày mai có ${nextLearningInfo.nextLearningCount} từ cần ôn tập`
                                : `Sau ${nextLearningInfo.daysUntilNext} ngày nữa có ${nextLearningInfo.nextLearningCount} từ cần ôn tập`
                              }
                            </p>
                            <p className="text-gray-700 text-sm mt-2">
                              Ngày: {formatDate(nextLearningInfo.nextLearningDate || '')}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => router.push('/learning')}
                          className="px-6 py-3 bg-gray-600 text-gray-50 rounded-lg font-semibold hover:bg-gray-500 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Quay lại menu
                        </button>
                        <button
                          onClick={fetchLearningItems}
                          className="px-6 py-3 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-lg font-semibold hover:from-primary-300 hover:to-primary-400 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Kiểm tra lại <span className="ml-2 text-sm opacity-70">(Enter)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="bg-gray-600 rounded-xl p-8 mb-8">
                        <div className="text-6xl mb-4">🏆</div>
                        <h3 className="text-2xl font-bold text-gray-50 mb-4">Chúc mừng!</h3>
                        <p className="text-xl text-gray-300 mb-6">
                          Tất cả từ vựng đã được học xong! Hãy thêm từ mới để tiếp tục học.
                        </p>
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => router.push('/learning')}
                          className="px-6 py-3 bg-gray-600 text-gray-50 rounded-lg font-semibold hover:bg-gray-500 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Quay lại menu
                        </button>
                        <button
                          onClick={() => router.push('/vocabulary/add')}
                          className="px-6 py-3 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-lg font-semibold hover:from-primary-300 hover:to-primary-400 transition-all duration-200"
                        >
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Thêm từ mới
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
  );
};

export default SmartLearningPage;