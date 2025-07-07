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
  TRANSITION = 'transition' // Thêm trạng thái chuyển tiếp giữa hai phần
}

// Định nghĩa cấu trúc của từ vựng
interface Term {
  id: number;
  vocab: string;
  meanings: string | string[];  // Can be JSON string or array
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
  // Loại bỏ khoảng trắng thừa, chuyển sang chữ thường và loại bỏ dấu
  return removeDiacritics(text.toLowerCase().trim());
}

const SmartLearningPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.LOADING);
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentPart, setCurrentPart] = useState(1); // 1: Anh → Việt, 2: Việt → Anh
  const [wrongTerms, setWrongTerms] = useState<Term[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [filteredTermIndex, setFilteredTermIndex] = useState(0); // Thêm state cho index trong filteredTerms
  const [currentMode, setCurrentMode] = useState<'en_to_vi' | 'vi_to_en'>('en_to_vi');
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [canProceedWithEnter, setCanProceedWithEnter] = useState(true);
  const isShowingResultRef = useRef(false);
  const [enterKeyEnabled, setEnterKeyEnabled] = useState(true);
  const [showUnikeyAlert, setShowUnikeyAlert] = useState(false); // Thêm state cho thông báo chuyển Unikey
  const [learningMode, setLearningMode] = useState<'en_to_vi' | 'vi_to_en' | 'both'>('both');
  const [mercifulMode, setMercifulMode] = useState(false); // Thêm state cho chế độ nhân từ
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Khởi tạo các giọng nói
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
        console.log('Đã tải', voices.length, 'giọng nói');
        
        // Tìm giọng đọc tiếng Anh
        const englishVoices = voices.filter(
          voice => voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );
        
        if (englishVoices.length > 0) {
          console.log('Đã tìm thấy', englishVoices.length, 'giọng đọc tiếng Anh');
          englishVoices.forEach((voice, index) => {
            console.log(`Giọng ${index + 1}: ${voice.name} (${voice.lang})`);
          });
        } else {
          console.log('Không tìm thấy giọng đọc tiếng Anh');
        }
      } else {
        console.log('Chưa tải được giọng nói, thử lại sau 100ms');
        setTimeout(loadVoices, 100);
      }
    };

    // Kiểm tra nếu trình duyệt hỗ trợ SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Đăng ký sự kiện onvoiceschanged
      speechSynthesis.onvoiceschanged = loadVoices;
      
      // Gọi loadVoices ngay lập tức để xử lý trường hợp
      // giọng nói đã được tải trước khi sự kiện onvoiceschanged được kích hoạt
      loadVoices();
    } else {
      console.log('Trình duyệt không hỗ trợ SpeechSynthesis');
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
    console.log("Smart learning page - Current state:", {
      user: user?.uid,
      loading,
      sessionState,
      termsCount: terms.length
    });

    if (user) {
      console.log("User authenticated, fetching terms");
      fetchLearningTerms();
    } else {
      console.log("User not authenticated yet");
    }
  }, [user]);

  const fetchLearningTerms = async () => {
    setSessionState(SessionState.LOADING);
    try {
      if (!user || !user.uid) {
        console.error("User not authenticated");
        router.push('/auth/signin');
        return;
      }

      // Gọi API với mode phù hợp
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
      console.error('Error fetching terms:', error);
      setSessionState(SessionState.FINISHED);
    }
  };

  const startLearning = () => {
    if (terms.length > 0) {
      setSessionState(SessionState.LEARNING);
      setCurrentTermIndex(0);
      setFilteredTermIndex(0); // Khởi tạo filteredTermIndex
      setProgress(0);
      
      // Thiết lập chế độ học dựa trên lựa chọn
      if (learningMode === 'en_to_vi') {
        setCurrentMode('en_to_vi');
        setCurrentPart(1); // Chỉ học phần 1
      } else if (learningMode === 'vi_to_en') {
        setCurrentMode('vi_to_en');
        setCurrentPart(2); // Chỉ học phần 2
      } else {
        // Chế độ cả hai: bắt đầu với Anh → Việt
        setCurrentMode('en_to_vi');
        setCurrentPart(1);
      }
      
      // Tự động focus vào ô nhập sau khi chuyển trạng thái
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const playAudio = (text: string) => {
    try {
      // Hủy bỏ bất kỳ phát âm nào đang diễn ra
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Tìm giọng đọc tiếng Anh thích hợp
      let voices = speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        // Đôi khi voices không được tải ngay lập tức
        // Chờ một chút và thử lại
        setTimeout(() => {
          voices = speechSynthesis.getVoices();
          const englishVoice = voices.find(
            voice => voice.lang.includes('en-US') || voice.lang.includes('en-GB')
          );
          
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
          
          // Cài đặt các tham số
          utterance.lang = 'en-US';
          utterance.rate = 0.8; // Giảm tốc độ đọc để rõ hơn
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          // Phát âm mới
          speechSynthesis.speak(utterance);
        }, 100);
      } else {
        const englishVoice = voices.find(
          voice => voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );
        
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        // Cài đặt các tham số
        utterance.lang = 'en-US';
        utterance.rate = 0.8; // Giảm tốc độ đọc để rõ hơn
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Phát âm mới
        speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Lỗi khi phát âm:', error);
    }
  };

  const handleAnswer = () => {
    if (!userAnswer.trim() || !canProceedWithEnter) return;
    
    const filteredTerms = getFilteredTerms();
    const currentTerm = filteredTerms[filteredTermIndex];
    let correct = false;
    
    if (currentMode === 'en_to_vi') {
      // Kiểm tra đáp án tiếng Việt
      const normalizedUserAnswer = normalizeForComparison(userAnswer);
      // Lấy danh sách meanings từ currentTerm
      let validMeanings: string[] = [];
      try {
        if (Array.isArray(currentTerm.meanings)) {
          validMeanings = currentTerm.meanings;
        } else if (typeof currentTerm.meanings === 'string') {
          validMeanings = JSON.parse(currentTerm.meanings);
          if (!Array.isArray(validMeanings)) validMeanings = [];
        } else {
          validMeanings = [];
        }
      } catch (e) {
        validMeanings = [];
      }
      // So sánh từng nghĩa đã chuẩn hóa
      correct = validMeanings.some(meaning => normalizeForComparison(meaning) === normalizedUserAnswer);
    } else {
      // Kiểm tra đáp án tiếng Anh
      const normalizedUserAnswer = normalizeForComparison(userAnswer);
      const normalizedCorrectAnswer = normalizeForComparison(currentTerm.vocab);
      correct = normalizedUserAnswer === normalizedCorrectAnswer;
    }

    setIsAnswerCorrect(correct);
    
    // Chỉ phát âm khi kiểm tra tiếng Anh hoặc khi sai ở chế độ Việt → Anh
    if ((currentMode === 'vi_to_en' && !correct) || currentMode === 'en_to_vi') {
      playAudio(currentTerm.vocab);
    }

    // Nếu đáp án sai và không ở chế độ nhân từ, thêm vào danh sách sai
    if (!correct && !mercifulMode) {
      setWrongTerms(prev => [...prev, currentTerm]);
    }

    // Cho phép tiếp tục sau 2 giây
    setTimeout(() => {
      setCanProceedWithEnter(true);
      setEnterKeyEnabled(true);
    }, 2000);
  };

  const nextTerm = async () => {
    // Vô hiệu hóa phím Enter ngay lập tức
    setEnterKeyEnabled(false);
    
    const filteredTerms = getFilteredTerms();
    const currentTermFromFiltered = filteredTerms[filteredTermIndex];
    // Tìm currentTerm trong terms gốc để cập nhật level
    const currentTermFromTerms = terms.find(term => term.id === currentTermFromFiltered.id);
    
    if (!currentTermFromTerms) {
      console.error('Không tìm thấy term trong terms gốc');
      return;
    }
    
    // Cập nhật level của từ hiện tại
    try {
      // Để server tự quyết định level, chỉ gửi các thông tin cần thiết
      const response = await fetch('/api/learning/update-level', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify({
          term_id: currentTermFromTerms.id,
          is_correct: isAnswerCorrect,
          mode: currentMode
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update level');
      }

      const responseData = await response.json();

      // Cập nhật level trong state local
      setTerms(prevTerms => 
        prevTerms.map(term => 
          term.id === currentTermFromTerms.id
            ? {
                ...term,
                level_en: responseData.new_level_en,
                level_vi: responseData.new_level_vi,
                review_time_en: responseData.next_review_time_en,
                review_time_vi: responseData.next_review_time_vi
              }
            : term
        )
      );

    } catch (error) {
      console.error('Error updating level:', error);
    }

    // Xử lý chuyển đổi giữa các từ và phần học
    if (learningMode === 'both') {
      if (currentPart === 1) { // Đang ở phần 1 (Anh → Việt)
        if (filteredTermIndex < filteredTerms.length - 1) {
          // Chuyển sang từ tiếp theo trong phần 1
          setFilteredTermIndex(prev => prev + 1);
          setUserAnswer('');
          setIsAnswerCorrect(null);
          setProgress(Math.round(((filteredTermIndex + 1) / filteredTerms.length) * 50)); // 50% cho phần 1
        } else {
          // Đã hoàn thành phần 1, chuyển sang phần 2
          setSessionState(SessionState.TRANSITION); // Chuyển sang trạng thái chuyển tiếp
          setShowUnikeyAlert(true); // Hiển thị thông báo chuyển Unikey
        }
      } else { // Đang ở phần 2 (Việt → Anh)
        if (filteredTermIndex > 0) {
          // Chuyển sang từ trước đó trong phần 2
          setFilteredTermIndex(prev => prev - 1);
          setUserAnswer('');
          setIsAnswerCorrect(null);
          // Tính toán tiến độ cho phần 2 (từ 50% đến 100%)
          setProgress(50 + Math.round(((filteredTerms.length - filteredTermIndex) / filteredTerms.length) * 50));
        } else {
          // Đã hoàn thành phần 2
          setSessionState(SessionState.FINISHED);
        }
      }
    } else if (learningMode === 'en_to_vi') {
      // Chỉ học Anh → Việt
      if (filteredTermIndex < filteredTerms.length - 1) {
        // Chuyển sang từ tiếp theo
        setFilteredTermIndex(prev => prev + 1);
        setUserAnswer('');
        setIsAnswerCorrect(null);
        setProgress(Math.round(((filteredTermIndex + 1) / filteredTerms.length) * 100)); // 100% cho toàn bộ
      } else {
        // Đã hoàn thành
        setSessionState(SessionState.FINISHED);
      }
    } else if (learningMode === 'vi_to_en') {
      // Chỉ học Việt → Anh
      if (filteredTermIndex < filteredTerms.length - 1) {
        // Chuyển sang từ tiếp theo
        setFilteredTermIndex(prev => prev + 1);
        setUserAnswer('');
        setIsAnswerCorrect(null);
        setProgress(Math.round(((filteredTermIndex + 1) / filteredTerms.length) * 100)); // 100% cho toàn bộ
      } else {
        // Đã hoàn thành
        setSessionState(SessionState.FINISHED);
      }
    }

    // Sau khi chuyển từ, cho phép sử dụng Enter để kiểm tra đáp án
    // Đợi một chút để đảm bảo DOM đã được cập nhật
    setTimeout(() => {
      setEnterKeyEnabled(true);
    }, 500);
  };

  // Hàm để chuyển từ trạng thái chuyển tiếp sang phần 2
  const startPart2 = () => {
    const filteredTerms = getFilteredTerms();
    setCurrentPart(2);
    setCurrentMode('vi_to_en');
    setCurrentTermIndex(filteredTerms.length - 1); // Bắt đầu từ từ cuối cùng và đi ngược lại
    setUserAnswer('');
    setIsAnswerCorrect(null);
    setProgress(50); // Bắt đầu phần 2 từ 50%
    setSessionState(SessionState.LEARNING);
    setShowUnikeyAlert(false);
    
    // Tự động focus vào ô nhập
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Cập nhật ref khi trạng thái thay đổi
  useEffect(() => {
    isShowingResultRef.current = isAnswerCorrect !== null;
  }, [isAnswerCorrect]);

  // Thêm hàm debounce
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout | undefined;
    return function(this: any, ...args: any[]) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  // Sử dụng debounce cho hàm xử lý phím Enter
  const debouncedHandleKeyDown = debounce((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isShowingResultRef.current) {
        nextTerm();
      } else if (sessionState === SessionState.LEARNING) {
        handleAnswer();
      }
    }
  }, 300);

  // Focus vào input khi chuyển từ
  useEffect(() => {
    if (sessionState === SessionState.LEARNING && isAnswerCorrect === null) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [sessionState, isAnswerCorrect, filteredTermIndex]);

  // Focus vào div kết quả khi hiển thị kết quả
  useEffect(() => {
    if (isAnswerCorrect !== null) {
      // Tự động phát âm khi hiển thị kết quả (nếu là từ tiếng Anh)
      if (currentMode === 'en_to_vi' || (!isAnswerCorrect && currentMode === 'vi_to_en')) {
        const filteredTerms = getFilteredTerms();
        const currentTerm = filteredTerms[filteredTermIndex];
        if (currentTerm) {
          playAudio(currentTerm.vocab);
        }
      }
    }
  }, [isAnswerCorrect, currentMode, filteredTermIndex, terms]);

  // Thêm useEffect để tự động chuyển khi trả lời đúng
  useEffect(() => {
    // Nếu đã hiển thị kết quả và đáp án đúng
    if (isAnswerCorrect === true) {
      // Tự động chuyển sau 1 giây
      // timer = setTimeout(() => {
      //   nextTerm();
      // }, 1000);
    }
    
    // Cleanup timer khi component unmount hoặc dependencies thay đổi
    return () => {
      // if (timer) clearTimeout(timer);
    };
  }, [isAnswerCorrect]); // Thêm nextTerm vào dependencies nếu cần

  // Chỉ xử lý phím Enter khi trả lời sai
  useEffect(() => {
    // Chỉ thêm event listener khi đang ở trạng thái LEARNING, đã hiển thị kết quả và kết quả là sai
    if (sessionState === SessionState.LEARNING && isAnswerCorrect === false) {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          nextTerm();
        }
      };
      
      // Thêm event listener
      window.addEventListener('keydown', handleKeyPress);
      
      // Cleanup khi component unmount hoặc dependencies thay đổi
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [sessionState, isAnswerCorrect]); // Thêm nextTerm vào dependencies nếu cần

  // Hàm lọc từ theo chế độ học
  const getFilteredTerms = () => {
    if (learningMode === 'en_to_vi') {
      // Học tiếng Việt: lọc theo level_vi
      return terms.filter(term => term.level_vi === 0);
    } else if (learningMode === 'vi_to_en') {
      // Học tiếng Anh: lọc theo level_en
      return terms.filter(term => term.level_en === 0);
    } else {
      // Học cả hai
      return terms.filter(term => term.level_vi === 0 || term.level_en === 0);
    }
  };

  // Hiển thị UI dựa trên trạng thái phiên học
  return (
    <Layout>
      <div className="min-h-screen bg-gray-800 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {sessionState === SessionState.LOADING && (
            <div className="flex justify-center items-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
            </div>
          )}
          
          {sessionState === SessionState.READY && (
            <div className="bg-gray-700 rounded-xl shadow-lg p-8">
              <h1 className="text-2xl font-bold mb-6 text-gray-50 text-center">Học thông minh</h1>
              
              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Phiên học thông minh giúp bạn học và ôn tập từ vựng hiệu quả. Hệ thống sẽ phân tích và đề xuất các từ cần ôn tập ngay bây giờ.
                </p>
                <p className="text-gray-300 mb-2">
                  <span className="font-bold text-primary-200">{terms.length}</span> từ vựng cần học trong phiên này.
                </p>
              </div>
              
              <div className="mb-8 bg-gray-600 rounded-lg p-4">
                <h2 className="font-semibold text-gray-50 mb-3">Thiết lập phiên học</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-1">Chế độ học:</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setLearningMode('both')}
                        className={`px-3 py-1.5 rounded-md ${
                          learningMode === 'both' 
                            ? 'bg-primary-200 text-gray-800' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Cả hai hướng
                      </button>
                      <button
                        onClick={() => setLearningMode('en_to_vi')}
                        className={`px-3 py-1.5 rounded-md ${
                          learningMode === 'en_to_vi' 
                            ? 'bg-primary-200 text-gray-800' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Anh → Việt
                      </button>
                      <button
                        onClick={() => setLearningMode('vi_to_en')}
                        className={`px-3 py-1.5 rounded-md ${
                          learningMode === 'vi_to_en' 
                            ? 'bg-primary-200 text-gray-800' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Việt → Anh
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="merciful-mode"
                      checked={mercifulMode}
                      onChange={(e) => setMercifulMode(e.target.checked)}
                      className="h-4 w-4 text-primary-200 border-gray-600 rounded focus:ring-primary-200 bg-gray-700"
                    />
                    <label htmlFor="merciful-mode" className="ml-2 text-gray-300">
                      Chế độ nhân từ (cho phép sai các lỗi nhỏ như dấu câu, hoa thường)
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={startLearning}
                  className="px-6 py-3 bg-primary-200 text-gray-800 rounded-lg font-semibold hover:bg-primary-300 transition-colors"
                >
                  Bắt đầu học
                </button>
              </div>
            </div>
          )}
          
          {sessionState === SessionState.LEARNING && terms.length > 0 && (
            <div>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-300 text-sm">
                    Tiến độ: {currentPart === 1 ? "Anh → Việt" : "Việt → Anh"}
                  </span>
                  <span className="text-gray-300 text-sm">
                    {filteredTermIndex + 1} / {getFilteredTerms().length}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div
                    className="bg-primary-200 h-2.5 rounded-full"
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

              {/* Main Learning UI */}
              <div className="bg-gray-700 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isCurrentTermNew() ? 'bg-error-200 text-gray-800' : 'bg-secondary-200 text-gray-800'
                    }`}>
                      {isCurrentTermNew() ? 'Từ mới' : `Cấp độ ${getCurrentTermLevel()}`}
                    </span>
                  </div>
                  <button 
                    onClick={playCurrentTerm}
                    className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 text-gray-300"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" fillRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-50 mb-2">
                    {getCurrentQuestion()}
                  </h2>
                  
                  {currentMode === 'en_to_vi' && getCurrentTerm()?.example_sentence && (
                    <p className="text-gray-400 italic mb-4">"{getCurrentTerm()?.example_sentence}"</p>
                  )}
                </div>
                
                <div className={`${isShowingResultRef.current ? 'opacity-50' : ''}`}>
                  <div className="relative mb-6">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userAnswer}
                      onChange={handleInputChange}
                      placeholder={`Nhập ${currentMode === 'en_to_vi' ? 'nghĩa tiếng Việt' : 'từ tiếng Anh'}...`}
                      disabled={isShowingResultRef.current}
                      className={`w-full px-4 py-3 border rounded-lg bg-gray-800 text-gray-50 placeholder-gray-500 focus:outline-none ${
                        isAnswerCorrect === null
                          ? 'border-gray-600 focus:border-primary-200'
                          : isAnswerCorrect
                          ? 'border-success-200 focus:border-success-200'
                          : 'border-error-200 focus:border-error-200'
                      }`}
                    />
                    {showUnikeyAlert && currentMode === 'vi_to_en' && (
                      <div className="absolute right-0 top-full mt-1 text-warning-200 text-xs">
                        Bạn đang gõ tiếng Việt! Hãy tắt Unikey để nhập từ tiếng Anh.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={handleAnswer}
                      disabled={isShowingResultRef.current || userAnswer.trim().length === 0}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                        isAnswerCorrect === null
                          ? 'bg-primary-200 text-gray-800 hover:bg-primary-300'
                          : isAnswerCorrect
                          ? 'bg-success-200 text-gray-800'
                          : 'bg-error-200 text-gray-800'
                      } disabled:opacity-50`}
                    >
                      {isAnswerCorrect === null
                        ? 'Kiểm tra'
                        : isAnswerCorrect
                        ? 'Đúng'
                        : 'Sai'}
                    </button>
                  </div>
                </div>
                
                {isShowingResultRef.current && (
                  <div className="mt-6 bg-gray-600 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-50 mb-2">
                      {isAnswerCorrect ? 'Chính xác!' : 'Đáp án đúng:'}
                    </h3>
                    <p className="text-gray-50 mb-4 text-lg">
                      {currentMode === 'en_to_vi' 
                        ? Array.isArray(getCurrentTerm()?.meanings) 
                          ? getCurrentTerm()?.meanings.join(', ') 
                          : getCurrentTerm()?.meanings 
                        : getCurrentTerm()?.vocab}
                    </p>
                    {getCurrentTerm()?.notes && (
                      <div className="mb-4">
                        <p className="text-gray-300 italic">{getCurrentTerm()?.notes}</p>
                      </div>
                    )}
                    <button
                      onClick={nextTerm}
                      className="px-6 py-2 bg-gray-700 text-gray-50 rounded hover:bg-gray-600 transition-colors"
                    >
                      Tiếp tục
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Transition Between Parts */}
          {sessionState === SessionState.TRANSITION && (
            <div className="bg-gray-700 rounded-xl shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-50">Hoàn thành phần 1: Anh → Việt</h2>
              <p className="text-gray-300 mb-8">
                Bạn đã hoàn thành phần 1. Giờ chúng ta sẽ tiếp tục với phần 2: từ tiếng Việt sang tiếng Anh.
              </p>
              <button
                onClick={startPart2}
                className="px-6 py-3 bg-primary-200 text-gray-800 rounded-lg font-semibold hover:bg-primary-300 transition-colors"
              >
                Tiếp tục phần 2
              </button>
            </div>
          )}
          
          {/* Reviewing */}
          {sessionState === SessionState.REVIEWING && wrongTerms.length > 0 && (
            <div>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-300 text-sm">Ôn tập lại từ bạn đã trả lời sai</span>
                  <span className="text-gray-300 text-sm">
                    {currentTermIndex + 1} / {wrongTerms.length}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div
                    className="bg-error-200 h-2.5 rounded-full"
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

              {/* Main Learning UI */}
              <div className="bg-gray-700 rounded-xl shadow-lg p-6">
                {/* Same UI as learning but with wrong terms */}
                {/* ... similar structure to the learning UI ... */}
              </div>
            </div>
          )}
          
          {/* Finished */}
          {sessionState === SessionState.FINISHED && (
            <div className="bg-gray-700 rounded-xl shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-50">Hoàn thành phiên học!</h2>
              
              {terms.length === 0 ? (
                <p className="text-gray-300 mb-8">
                  Hiện tại bạn không có từ vựng cần ôn tập. Hãy quay lại sau hoặc thêm từ mới vào hệ thống.
                </p>
              ) : (
                <>
                  <p className="text-gray-300 mb-2">
                    Bạn đã học thành công {terms.length} từ vựng. Hệ thống đã ghi nhận và cập nhật tiến độ học tập của bạn.
                  </p>
                  <p className="text-gray-300 mb-8">
                    Hãy quay lại sau để tiếp tục ôn tập và nâng cao vốn từ vựng của mình.
                  </p>
                </>
              )}
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => router.push('/learning')}
                  className="px-6 py-3 bg-gray-600 text-gray-50 rounded-lg font-semibold hover:bg-gray-500 transition-colors"
                >
                  Quay lại menu
                </button>
                <button
                  onClick={fetchLearningTerms}
                  className="px-6 py-3 bg-primary-200 text-gray-800 rounded-lg font-semibold hover:bg-primary-300 transition-colors"
                >
                  Học lại
                </button>
                <button
                  onClick={() => router.push('/vocab/add')}
                  className="px-6 py-3 bg-secondary-200 text-gray-800 rounded-lg font-semibold hover:bg-secondary-300 transition-colors"
                >
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