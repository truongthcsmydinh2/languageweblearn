import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout';

// Định nghĩa các trạng thái của phiên học
enum SessionState {
  LOADING = 'loading',
  READY = 'ready',
  LEARNING = 'learning',
  REVIEWING = 'reviewing',
  FINISHED = 'finished',
  TRANSITION = 'transition'
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
  review_time_en: number | null;
  review_time_vi: number | null;
  last_review_en: number | null;
  last_review_vi: number | null;
  created_at: string;
  updated_at: string;
}

// Hàm loại bỏ dấu tiếng Việt
function removeDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (match) => match === 'đ' ? 'd' : 'D');
}

// Hàm chuyển đổi đáp án để so sánh
function normalizeForComparison(text: string): string {
  return removeDiacritics(text.toLowerCase().trim());
}

const SmartLearningPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.LOADING);
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentPart, setCurrentPart] = useState(1);
  const [wrongTerms, setWrongTerms] = useState<Term[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [filteredTermIndex, setFilteredTermIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<'en_to_vi' | 'vi_to_en'>('en_to_vi');
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [canProceedWithEnter, setCanProceedWithEnter] = useState(true);
  const isShowingResultRef = useRef(false);
  const [enterKeyEnabled, setEnterKeyEnabled] = useState(true);
  const [showUnikeyAlert, setShowUnikeyAlert] = useState(false);
  const [learningMode, setLearningMode] = useState<'en_to_vi' | 'vi_to_en' | 'both'>('both');
  const [mercifulMode, setMercifulMode] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [countdown, setCountdown] = useState('');
  // Tính toán các từ đến hạn ôn tập (dùng cho nhiều nơi trong render)
  const now = Date.now();
  const dueTerms = terms.filter(term =>
    (term.review_time_en && Number(term.review_time_en) <= now) ||
    (term.review_time_vi && Number(term.review_time_vi) <= now)
  );

  // Khởi tạo các giọng nói
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
        
        const englishVoices = voices.filter(
          voice => voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );
        
        if (englishVoices.length > 0) {
        }
      } else {
        setTimeout(loadVoices, 100);
      }
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchLearningTerms();
    }
  }, [user]);

  const fetchLearningTerms = async () => {
    setSessionState(SessionState.LOADING);
    try {
      if (!user || !user.uid) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch(`/api/learning/smart?mode=${learningMode}`, {
        headers: {
          'firebase_uid': user.uid,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.terms && data.terms.length > 0) {
        setTerms(data.terms);
        setSessionState(SessionState.READY);
      } else {
        setSessionState(SessionState.FINISHED);
      }
    } catch (error) {
      setSessionState(SessionState.FINISHED);
    }
  };

  const startLearning = () => {
    if (terms.length > 0) {
      setSessionState(SessionState.LEARNING);
      setCurrentTermIndex(0);
      setFilteredTermIndex(0);
      setProgress(0);
      setStats({ correct: 0, total: 0 });
      
      if (learningMode === 'en_to_vi') {
        setCurrentMode('en_to_vi');
        setCurrentPart(1);
      } else if (learningMode === 'vi_to_en') {
        setCurrentMode('vi_to_en');
        setCurrentPart(2);
      } else {
        setCurrentMode('en_to_vi');
        setCurrentPart(1);
      }
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const playAudio = (text: string) => {
    try {
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.includes('en-US') || voice.lang.includes('en-GB')
      );
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      speechSynthesis.speak(utterance);
    } catch (error) {
    }
  };

  const handleAnswer = async () => {
    if (userAnswer.trim().length === 0) return;
    
    const currentTerm = getCurrentTerm();
    if (!currentTerm) return;
    
    let isCorrect = false;
    
    if (currentMode === 'en_to_vi') {
      const correctAnswers = Array.isArray(currentTerm.meanings) 
        ? currentTerm.meanings 
        : [currentTerm.meanings];
      
      isCorrect = correctAnswers.some(answer => 
        normalizeForComparison(answer) === normalizeForComparison(userAnswer)
      );
    } else {
      isCorrect = normalizeForComparison(currentTerm.vocab) === normalizeForComparison(userAnswer);
    }
    
    setIsAnswerCorrect(isCorrect);
    isShowingResultRef.current = true;
    setCanProceedWithEnter(false);
    
    if (!isCorrect) {
      setWrongTerms(prev => [...prev, currentTerm]);
    }
    
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Gọi API cập nhật level
    try {
      if (user && currentTerm) {
        const response = await fetch('/api/learning/update-level', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'firebase_uid': user.uid
          },
          body: JSON.stringify({
            term_id: currentTerm.id,
            is_correct: isCorrect,
            mode: currentMode
          })
        });
        if (response.ok) {
          const data = await response.json();
          // Cập nhật lại state terms với level mới
          setTerms(prevTerms => prevTerms.map(term => {
            if (term.id === currentTerm.id) {
              return {
                ...term,
                level_en: data.new_level_en,
                level_vi: data.new_level_vi,
                review_time_en: data.next_review_time_en || term.review_time_en,
                review_time_vi: data.next_review_time_vi || term.review_time_vi
              };
            }
            return term;
          }));
        }
      }
    } catch (error) {
      // Có thể log lỗi nếu cần
    }
  };

  const nextTerm = async () => {
    const filteredTerms = getFilteredTerms();
    
    if (filteredTermIndex < filteredTerms.length - 1) {
      setFilteredTermIndex(prev => prev + 1);
      setCurrentTermIndex(prev => prev + 1);
      setUserAnswer('');
      setIsAnswerCorrect(null);
      isShowingResultRef.current = false;
      setCanProceedWithEnter(true);
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      if (learningMode === 'both' && currentPart === 1) {
        setSessionState(SessionState.TRANSITION);
      } else {
        if (wrongTerms.length > 0) {
          setSessionState(SessionState.REVIEWING);
          setCurrentTermIndex(0);
        } else {
          setSessionState(SessionState.FINISHED);
        }
      }
    }
  };

  const startPart2 = () => {
    setCurrentMode('vi_to_en');
    setCurrentPart(2);
    setSessionState(SessionState.LEARNING);
    setCurrentTermIndex(0);
    setFilteredTermIndex(0);
    setUserAnswer('');
    setIsAnswerCorrect(null);
    isShowingResultRef.current = false;
    setCanProceedWithEnter(true);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (sessionState === SessionState.LEARNING && enterKeyEnabled) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (isShowingResultRef.current) {
            nextTerm();
          } else if (userAnswer.trim().length > 0) {
            handleAnswer();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [sessionState, userAnswer, enterKeyEnabled]);

  const getFilteredTerms = () => {
    return terms.filter(term => {
      if (currentMode === 'en_to_vi') {
        return term.level_en < 10;
      } else {
        return term.level_vi < 10;
      }
    });
  };

  function isCurrentTermNew() {
    const currentTerm = getCurrentTerm();
    if (!currentTerm) return false;
    return currentMode === 'en_to_vi' ? currentTerm.level_en === 0 : currentTerm.level_vi === 0;
  }

  function getCurrentTerm() {
    const filteredTerms = getFilteredTerms();
    return filteredTerms[filteredTermIndex];
  }

  function getCurrentTermLevel() {
    const currentTerm = getCurrentTerm();
    if (!currentTerm) return 0;
    return currentMode === 'en_to_vi' ? currentTerm.level_en : currentTerm.level_vi;
  }

  function getCurrentQuestion() {
    const currentTerm = getCurrentTerm();
    if (!currentTerm) return '';
    return currentMode === 'en_to_vi' ? currentTerm.vocab : (Array.isArray(currentTerm.meanings) ? currentTerm.meanings[0] : currentTerm.meanings);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUserAnswer(e.target.value);
  }

  function playCurrentTerm() {
    const currentTerm = getCurrentTerm();
    if (currentTerm) {
      playAudio(currentTerm.vocab);
    }
  }

  // Hàm tính toán ngày (yyyy-mm-dd) từ timestamp
  function getDateString(ts: number) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
  }

  // Sửa lại hàm getUpcomingReviewInfoByDay: chỉ lấy ngày, tìm ngày gần nhất có từ cần ôn tập
  function getUpcomingReviewInfoByDay() {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // reset về đầu ngày
    const todayStr = getDateString(now.getTime());
    // Gom tất cả các ngày review_time_en/vi > hôm nay
    const allDates: Record<string, { terms: Term[], type: string }[]> = {};

    terms.forEach(term => {
      if (term.review_time_en && term.review_time_en > now.getTime()) {
        const day = getDateString(term.review_time_en);
        if (!allDates[day]) allDates[day] = [];
        allDates[day].push({ terms: [term], type: 'en' });
      }
      if (term.review_time_vi && term.review_time_vi > now.getTime()) {
        const day = getDateString(term.review_time_vi);
        if (!allDates[day]) allDates[day] = [];
        allDates[day].push({ terms: [term], type: 'vi' });
      }
    });
    // Lấy danh sách ngày lớn hơn hôm nay, sắp xếp tăng dần
    const futureDays = Object.keys(allDates).filter(day => day > todayStr).sort();
    if (futureDays.length === 0) {
      return { nextDay: null, count: 0, type: '', terms: [] };
    }
    const nextDay = futureDays[0];
    // Đếm tổng số từ cần ôn tập trong ngày đó
    let count = 0;
    let type = '';
    let termsList: Term[] = [];
    allDates[nextDay].forEach(item => {
      count += item.terms.length;
      type = item.type; // chỉ lấy type đầu tiên (en/vi)
      termsList = termsList.concat(item.terms);
    });

    return { nextDay, count, type, terms: termsList };
  }

  // Sửa lại hàm tính thời gian ôn tập tiếp theo cho từng level
  function calculateNextReviewTime(level: number): number {
    const now = new Date();
    let next = new Date(now);
    switch (level) {
      case 0:
        return now.getTime(); // ngay lập tức
      case 1:
        next.setDate(now.getDate() + 1); break;
      case 2:
        next.setDate(now.getDate() + 2); break;
      case 3:
        next.setDate(now.getDate() + 3); break;
      case 4:
        next.setDate(now.getDate() + 4); break;
      case 5:
        next.setDate(now.getDate() + 7); break;
      case 6:
        next.setDate(now.getDate() + 14); break;
      case 7:
        next.setMonth(now.getMonth() + 1); break;
      case 8:
        next.setMonth(now.getMonth() + 2); break;
      case 9:
        next.setMonth(now.getMonth() + 3); break;
      case 10:
        next.setMonth(now.getMonth() + 6); break;
      default:
        return now.getTime();
    }
    return next.getTime();
  }

  // Thêm các hàm tính toán số từ sắp tới cần học và thời gian còn lại
  function getUpcomingReviewInfo() {
    const now = Date.now();
    // Lấy tất cả các review_time_en/vi lớn hơn hiện tại (tức là sắp tới)
    const upcoming = terms.flatMap(term => [
      (term.review_time_en && term.review_time_en > now) ? { time: term.review_time_en, type: 'en', term } : null,
      (term.review_time_vi && term.review_time_vi > now) ? { time: term.review_time_vi, type: 'vi', term } : null
    ]).filter(Boolean) as { time: number, type: string, term: Term }[];
    // Sắp xếp tăng dần theo thời gian
    upcoming.sort((a, b) => a.time - b.time);
    return {
      count: upcoming.length,
      next: upcoming[0] || null
    };
  }

  function formatCountdown(ms: number) {
    if (ms <= 0) return 'Đã đến hạn';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days} ngày ${hours} giờ nữa`;
    if (hours > 0) return `${hours} giờ ${minutes} phút nữa`;
    if (minutes > 0) return `${minutes} phút nữa`;
    return `${totalSeconds} giây nữa`;
  }

  // Cập nhật countdown mỗi giây nếu có từ sắp tới
  useEffect(() => {
    const { next } = getUpcomingReviewInfo();
    if (!next) return;
    const update = () => {
      setCountdown(formatCountdown(next.time - Date.now()));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [terms]);

  // Hiển thị UI dựa trên trạng thái phiên học
  return (
    <Layout>
      <div className="min-h-screen bg-gray-800 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Loading State */}
          {sessionState === SessionState.LOADING && (
            <div className="flex flex-col justify-center items-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-200 mb-4"></div>
              <p className="text-gray-400 text-lg">Đang tải dữ liệu học tập...</p>
            </div>
          )}
          
          {/* Ready State */}
          {sessionState === SessionState.READY && (
            <div className="bg-gray-700 rounded-2xl shadow-2xl p-8 border border-gray-600">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-200 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-50 mb-2">Học thông minh</h1>
                <p className="text-gray-400 text-lg">Hệ thống AI sẽ giúp bạn học từ vựng hiệu quả nhất</p>
              </div>
              
              {/* Thông báo số từ sắp tới cần học và đồng hồ đếm ngược */}
              {(() => {
                const info = getUpcomingReviewInfoByDay();
                return (
                  <>
                    {info.nextDay && (
                      <div className="mb-6 flex items-center gap-4 bg-gray-600 rounded-xl p-4 justify-center">
                        <div className="flex items-center gap-2">
                          <svg className="w-6 h-6 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-lg text-primary-200 font-semibold">{info.count} từ cần ôn tập vào ngày {info.nextDay.split('-').reverse().join('/')}</span>
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <button
                        onClick={startLearning}
                        disabled={dueTerms.length === 0}
                        className={
                          "px-8 py-4 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-xl font-bold text-lg hover:from-primary-300 hover:to-primary-400 transition-all duration-200 transform hover:scale-105 shadow-lg" +
                          (dueTerms.length === 0 ? ' opacity-50 cursor-not-allowed' : '')
                        }
                      >
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Bắt đầu học ngay
                      </button>
                      {dueTerms.length === 0 && info.nextDay && (
                        <div className="text-warning-200 mt-4">
                          Hiện tại bạn chưa có từ nào đến hạn ôn tập. Hãy quay lại vào ngày {info.nextDay.split('-').reverse().join('/')}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
              
              {/* Block Từ cần học & Thời gian ước tính */}
              {dueTerms.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-600 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-primary-200 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-gray-800 font-bold text-lg">{terms.length}</span>
                      </div>
                      <div>
                        <h3 className="text-gray-50 font-semibold">Từ cần học</h3>
                        <p className="text-gray-400 text-sm">Được đề xuất bởi AI</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-600 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-secondary-200 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-gray-50 font-semibold">Thời gian ước tính</h3>
                        <p className="text-gray-400 text-sm">~{Math.ceil(terms.length * 0.8)} phút</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Thiết lập phiên học */}
              {dueTerms.length > 0 && (
                <div className="bg-gray-600 rounded-xl p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-50 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Thiết lập phiên học
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-300 mb-3 font-medium">Chế độ học:</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setLearningMode('both')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            learningMode === 'both' 
                              ? 'border-primary-200 bg-primary-200 text-gray-800 shadow-lg' 
                              : 'border-gray-500 bg-gray-700 text-gray-300 hover:border-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">🔄</div>
                            <div className="font-semibold">Cả hai hướng</div>
                            <div className="text-xs mt-1">Anh ↔ Việt</div>
                          </div>
                        </button>
                        <button
                          onClick={() => setLearningMode('en_to_vi')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            learningMode === 'en_to_vi' 
                              ? 'border-primary-200 bg-primary-200 text-gray-800 shadow-lg' 
                              : 'border-gray-500 bg-gray-700 text-gray-300 hover:border-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">🇺🇸</div>
                            <div className="font-semibold">Anh → Việt</div>
                            <div className="text-xs mt-1">Nghe → Viết</div>
                          </div>
                        </button>
                        <button
                          onClick={() => setLearningMode('vi_to_en')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            learningMode === 'vi_to_en' 
                              ? 'border-primary-200 bg-primary-200 text-gray-800 shadow-lg' 
                              : 'border-gray-500 bg-gray-700 text-gray-300 hover:border-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">🇻🇳</div>
                            <div className="font-semibold">Việt → Anh</div>
                            <div className="text-xs mt-1">Viết → Nghe</div>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-4 bg-gray-700 rounded-lg">
                      <input
                        type="checkbox"
                        id="merciful-mode"
                        checked={mercifulMode}
                        onChange={(e) => setMercifulMode(e.target.checked)}
                        className="h-5 w-5 text-primary-200 border-gray-600 rounded focus:ring-primary-200 bg-gray-700"
                      />
                      <label htmlFor="merciful-mode" className="ml-3 text-gray-300">
                        <span className="font-medium">Chế độ nhân từ</span>
                        <div className="text-sm text-gray-400">Cho phép sai các lỗi nhỏ như dấu câu, hoa thường</div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Learning State */}
          {sessionState === SessionState.LEARNING && terms.length > 0 && (
            <div>
              {/* Header với Progress */}
              <div className="bg-gray-700 rounded-2xl shadow-2xl p-6 mb-6 border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        currentMode === 'en_to_vi' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {currentMode === 'en_to_vi' ? '🇺🇸 Anh → Việt' : '🇻🇳 Việt → Anh'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isCurrentTermNew() ? 'bg-error-200 text-gray-800' : 'bg-secondary-200 text-gray-800'
                      }`}>
                        {isCurrentTermNew() ? '🆕 Từ mới' : `📊 Cấp ${getCurrentTermLevel()}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Tiến độ</div>
                      <div className="text-lg font-bold text-gray-50">
                        {filteredTermIndex + 1} / {getFilteredTerms().length}
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
                      width: `${
                        getFilteredTerms().length
                          ? ((filteredTermIndex + 1) / getFilteredTerms().length) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Main Learning Card */}
              <div className="bg-gray-700 rounded-2xl shadow-2xl p-8 border border-gray-600">
                <div className="flex items-center mb-4">
                  <span className="text-sm font-medium text-primary-200">
                    {currentMode === 'en_to_vi'
                      ? 'Chế độ: Trả lời bằng tiếng Việt'
                      : 'Chế độ: Trả lời bằng tiếng Anh'}
                  </span>
                </div>
                <div className="flex justify-between items-start mb-8">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-50 mb-4">
                      {getCurrentQuestion()}
                    </h2>
                    
                    {currentMode === 'en_to_vi' && getCurrentTerm()?.example_sentence && (
                      <div className="bg-gray-600 rounded-lg p-4 mb-6">
                        <p className="text-gray-300 italic text-lg">"{getCurrentTerm()?.example_sentence}"</p>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={playCurrentTerm}
                    className="ml-4 p-4 rounded-full bg-gradient-to-r from-primary-200 to-primary-300 hover:from-primary-300 hover:to-primary-400 text-gray-800 transition-all duration-200 transform hover:scale-110 shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" fillRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
                
                <div className={`transition-opacity duration-300 ${isShowingResultRef.current ? 'opacity-50' : ''}`}>
                  <div className="relative mb-8">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userAnswer}
                      onChange={handleInputChange}
                      placeholder={`Nhập ${currentMode === 'en_to_vi' ? 'nghĩa tiếng Việt' : 'từ tiếng Anh'}...`}
                      disabled={isShowingResultRef.current}
                      className={`w-full px-6 py-4 text-xl border-2 rounded-xl bg-gray-800 text-gray-50 placeholder-gray-500 focus:outline-none transition-all duration-200 ${
                        isAnswerCorrect === null
                          ? 'border-gray-600 focus:border-primary-200 focus:ring-2 focus:ring-primary-200/20'
                          : isAnswerCorrect
                          ? 'border-success-200 focus:border-success-200 focus:ring-2 focus:ring-success-200/20'
                          : 'border-error-200 focus:border-error-200 focus:ring-2 focus:ring-error-200/20'
                      }`}
                    />
                    {showUnikeyAlert && currentMode === 'vi_to_en' && (
                      <div className="absolute right-0 top-full mt-2 text-warning-200 text-sm bg-warning-200/10 px-3 py-1 rounded-lg">
                        ⚠️ Bạn đang gõ tiếng Việt! Hãy tắt Unikey để nhập từ tiếng Anh.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={handleAnswer}
                      disabled={isShowingResultRef.current || userAnswer.trim().length === 0}
                      className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                        isAnswerCorrect === null
                          ? 'bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 hover:from-primary-300 hover:to-primary-400 shadow-lg'
                          : isAnswerCorrect
                          ? 'bg-gradient-to-r from-success-200 to-success-300 text-gray-800 shadow-lg'
                          : 'bg-gradient-to-r from-error-200 to-error-300 text-gray-800 shadow-lg'
                      } disabled:opacity-50 disabled:transform-none`}
                    >
                      {isAnswerCorrect === null
                        ? '🔍 Kiểm tra'
                        : isAnswerCorrect
                        ? '✅ Đúng rồi!'
                        : '❌ Sai rồi!'}
                    </button>
                  </div>
                </div>
                
                {isShowingResultRef.current && (
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
                         {currentMode === 'en_to_vi'
                           ? (Array.isArray(getCurrentTerm()?.meanings) ? (getCurrentTerm()?.meanings as string[]).join(', ') : getCurrentTerm()?.meanings)
                           : getCurrentTerm()?.vocab}
                       </p>
                     </div>
                    
                    {getCurrentTerm()?.notes && (
                      <div className="bg-gray-700 rounded-lg p-4 mb-4">
                        <p className="text-gray-300 italic">💡 {getCurrentTerm()?.notes}</p>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <button
                        onClick={nextTerm}
                        className="px-6 py-3 bg-gradient-to-r from-secondary-200 to-secondary-300 text-gray-800 rounded-lg font-semibold hover:from-secondary-300 hover:to-secondary-400 transition-all duration-200"
                      >
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Tiếp tục
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Transition State */}
          {sessionState === SessionState.TRANSITION && (
            <div className="bg-gray-700 rounded-2xl shadow-2xl p-8 text-center border border-gray-600">
              <div className="w-20 h-20 bg-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-gray-50">🎉 Hoàn thành phần 1!</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Bạn đã hoàn thành xuất sắc phần Anh → Việt. Giờ chúng ta sẽ tiếp tục với phần Việt → Anh để củng cố kiến thức.
              </p>
              <div className="bg-gray-600 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-success-200">{stats.correct}</div>
                    <div className="text-gray-400">Đúng</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-300">{stats.total}</div>
                    <div className="text-gray-400">Tổng cộng</div>
                  </div>
                </div>
              </div>
              <button
                onClick={startPart2}
                className="px-8 py-4 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-xl font-bold text-lg hover:from-primary-300 hover:to-primary-400 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Tiếp tục phần 2
              </button>
            </div>
          )}
          
          {/* Reviewing State */}
          {sessionState === SessionState.REVIEWING && wrongTerms.length > 0 && (
            <div>
              <div className="bg-gray-700 rounded-2xl shadow-2xl p-6 mb-6 border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-error-200 text-gray-800">
                      🔄 Ôn tập lại
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Tiến độ ôn tập</div>
                    <div className="text-lg font-bold text-gray-50">
                      {currentTermIndex + 1} / {wrongTerms.length}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-error-200 to-error-300 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        wrongTerms.length
                          ? ((currentTermIndex + 1) / wrongTerms.length) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-2xl shadow-2xl p-8 border border-gray-600">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-50 mb-4">
                    Ôn tập từ đã sai
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Hãy cố gắng trả lời đúng những từ này để củng cố kiến thức
                  </p>
                </div>
                
                {/* Similar UI structure as learning state but for wrong terms */}
                <div className="text-center">
                  <button
                    onClick={() => setSessionState(SessionState.FINISHED)}
                    className="px-6 py-3 bg-gradient-to-r from-secondary-200 to-secondary-300 text-gray-800 rounded-lg font-semibold hover:from-secondary-300 hover:to-secondary-400 transition-all duration-200"
                  >
                    Bỏ qua ôn tập
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Finished State */}
          {sessionState === SessionState.FINISHED && (
            <div className="bg-gray-700 rounded-2xl shadow-2xl p-8 text-center border border-gray-600">
              <div className="w-24 h-24 bg-gradient-to-r from-success-200 to-success-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold mb-4 text-gray-50">🎉 Hoàn thành phiên học!</h2>
              
              {/* Thông báo số từ sắp tới cần học và đồng hồ đếm ngược */}
              {(() => {
                const info = getUpcomingReviewInfoByDay();
                if (info.nextDay) {
                  return (
                    <div className="mb-6 flex items-center gap-4 bg-gray-600 rounded-xl p-4 justify-center">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-lg text-primary-200 font-semibold">{info.count} từ cần ôn tập vào ngày {info.nextDay.split('-').reverse().join('/')}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {terms.length === 0 ? (
                <p className="text-gray-300 mb-8 text-lg">
                  Hiện tại bạn không có từ vựng cần ôn tập. Hãy quay lại sau hoặc thêm từ mới vào hệ thống.
                </p>
              ) : (
                <>
                  <div className="bg-gray-600 rounded-xl p-6 mb-8">
                    <div className="grid grid-cols-2 gap-6 text-center">
                      <div>
                        <div className="text-3xl font-bold text-success-200">{stats.correct}</div>
                        <div className="text-gray-400">Đúng</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-gray-300">{stats.total}</div>
                        <div className="text-gray-400">Tổng cộng</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-500">
                      <div className="text-2xl font-bold text-primary-200">
                        {Math.round((stats.correct / stats.total) * 100)}%
                      </div>
                      <div className="text-gray-400">Tỷ lệ đúng</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-8 text-lg">
                    Bạn đã học thành công {terms.length} từ vựng. Hệ thống đã ghi nhận và cập nhật tiến độ học tập của bạn.
                  </p>
                </>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  onClick={fetchLearningTerms}
                  className="px-6 py-3 bg-gradient-to-r from-primary-200 to-primary-300 text-gray-800 rounded-lg font-semibold hover:from-primary-300 hover:to-primary-400 transition-all duration-200"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Học lại
                </button>
                <button
                  onClick={() => router.push('/vocab/add')}
                  className="px-6 py-3 bg-gradient-to-r from-secondary-200 to-secondary-300 text-gray-800 rounded-lg font-semibold hover:from-secondary-300 hover:to-secondary-400 transition-all duration-200"
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Thêm từ mới
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SmartLearningPage;