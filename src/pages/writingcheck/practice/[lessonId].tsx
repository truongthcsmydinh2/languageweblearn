import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import useRequireAuth from '@/hooks/useRequireAuth';
import { isIOSDevice, isIPadDevice } from '@/utils/deviceDetection';

interface LessonDetail {
  id: number;
  title: string;
  content: string;
  type: string;
  level: string;
  sentences: { id: number; vietnamese_text: string; sentence_order: number; answer_key?: string; answerKey?: string }[];
}

interface UserProgress {
  id: number;
  firebase_uid: string;
  lesson_id: number;
  current_sentence: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface GeminiResponse {
  accuracy: number;
  feedback: string;
  errors: string[];
  suggestions: string[];
  corrected_version: string;
  advice: string;
  vocabulary_analysis?: {
    word: string;
    current_band: string;
    suggested_alternatives: {
      word: string;
      band: string;
    }[];
  }[];
}

interface DictionaryResult {
  word: string;
  phonetic?: string;
  vietnameseTranslation?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
    }[];
  }[];
  loading: boolean;
}

const PracticePage = () => {
  const router = useRouter();
  const { lessonId } = router.query;
  const { user } = useAuth();
  
  useRequireAuth();
  
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [inputs, setInputs] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<(GeminiResponse | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // loading khi submit
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Dictionary popup states
  const [showDictionary, setShowDictionary] = useState(false);
  const [dictionaryResult, setDictionaryResult] = useState<DictionaryResult | null>(null);
  const [dictionaryPosition, setDictionaryPosition] = useState({ x: 0, y: 0 });
  const dictionaryRef = useRef<HTMLDivElement>(null);
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Thêm state cho long press
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });

  // Thêm state để lưu thông tin thiết bị
  const [isIOS, setIsIOS] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  
  // Kiểm tra loại thiết bị khi component được mount
  useEffect(() => {
    // Chỉ thực hiện trên client-side
    if (typeof window !== 'undefined') {
      setIsIOS(isIOSDevice());
      setIsIPad(isIPadDevice());
    }
  }, []);

  // Hàm xác định màu sắc dựa trên accuracy
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 76) return 'text-green-400';
    if (accuracy >= 51) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Hàm xác định màu nền dựa trên accuracy
  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 76) return 'bg-green-400';
    if (accuracy >= 51) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  // Hàm xác định đánh giá dựa trên accuracy
  const getAccuracyRating = (accuracy: number) => {
    if (accuracy >= 76) return 'Excellent!';
    if (accuracy >= 51) return 'Good!';
    if (accuracy >= 26) return 'Fair';
    return 'Needs improvement';
  };

  // Hàm highlight các từ tiếng Anh trong text
  const highlightEnglishWords = (text: string) => {
    // Chỉ highlight nội dung trong dấu ngoặc kép và loại bỏ dấu ngoặc kép
    return text.replace(/"([^"]+)"/g, (match, content) => {
      return `<span class="text-yellow-400 font-semibold">${content}</span>`;
    });
  };

  // Xử lý bắt đầu kéo popup
  const handleDragStart = (e: React.MouseEvent) => {
    if (dictionaryRef.current) {
      // Tính toán offset giữa vị trí click và góc trên bên trái của popup
      const rect = dictionaryRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      setDragOffset({ x: offsetX, y: offsetY });
      setIsDragging(true);
    }
  };
  
  // Xử lý kéo popup
  const handleDrag = (e: MouseEvent) => {
    if (isDragging) {
      // Tính toán vị trí mới dựa trên vị trí chuột và offset
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Đảm bảo popup không bị kéo ra ngoài màn hình
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const popupWidth = dictionaryRef.current?.offsetWidth || 320;
      const popupHeight = dictionaryRef.current?.offsetHeight || 300;
      
      const boundedX = Math.max(0, Math.min(newX, windowWidth - popupWidth));
      const boundedY = Math.max(0, Math.min(newY, windowHeight - popupHeight));
      
      setDictionaryPosition({ x: boundedX, y: boundedY });
    }
  };
  
  // Xử lý kết thúc kéo popup
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // Thêm event listeners cho drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragOffset]);

  // Thêm xử lý phím Enter cho toàn trang
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Nếu đang nhập liệu trong textarea, không xử lý
      if (document.activeElement?.tagName === 'TEXTAREA') return;
      
      // Nếu nhấn Enter và có feedback cho câu hiện tại
      if (e.key === 'Enter' && feedbacks[currentIndex]) {
        handleNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, feedbacks]);

  // Tách logic hiển thị popup từ điển thành hàm riêng để tái sử dụng
  const showDictionaryPopup = async (selectedText: string, clientX: number, clientY: number) => {
    // Lấy vị trí để hiển thị popup
    const x = clientX;
    const y = clientY;
    
    // Kiểm tra vị trí để tránh hiển thị ngoài màn hình
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    // Hiển thị loading
    setDictionaryResult({
      word: selectedText,
      meanings: [],
      loading: true
    });
    setShowDictionary(true);
    
    // Đợi một chút để DOM cập nhật và lấy kích thước của popup
    setTimeout(() => {
      if (dictionaryRef.current) {
        const popupHeight = dictionaryRef.current.offsetHeight;
        const popupWidth = dictionaryRef.current.offsetWidth;
        
        // Điều chỉnh vị trí Y nếu popup sẽ bị cắt ở dưới
        let adjustedY = y + 10;
        if (adjustedY + popupHeight > windowHeight) {
          adjustedY = Math.max(10, y - popupHeight - 10);
        }
        
        // Điều chỉnh vị trí X nếu popup sẽ bị cắt ở bên phải
        let adjustedX = x - 100;
        if (adjustedX + popupWidth > windowWidth) {
          adjustedX = windowWidth - popupWidth - 10;
        }
        if (adjustedX < 10) adjustedX = 10;
        
        setDictionaryPosition({ x: adjustedX, y: adjustedY });
      }
    }, 0);
    
    try {
      // Gọi API từ điển tiếng Anh
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selectedText}`);
      let englishData = null;
      
      if (response.ok) {
        englishData = await response.json();
      }
      
      // Gọi API dịch sang tiếng Việt
      const translateResponse = await fetch(`https://api.mymemory.translated.net/get?q=${selectedText}&langpair=en|vi`);
      let vietnameseTranslation = null;
      
      if (translateResponse.ok) {
        const translateData = await translateResponse.json();
        if (translateData.responseStatus === 200 && translateData.responseData) {
          vietnameseTranslation = translateData.responseData.translatedText;
        }
      }
      
      if (englishData && englishData.length > 0) {
        setDictionaryResult({
          word: englishData[0].word,
          phonetic: englishData[0].phonetic,
          meanings: englishData[0].meanings || [],
          vietnameseTranslation,
          loading: false
        });
      } else {
        setDictionaryResult({
          word: selectedText,
          vietnameseTranslation,
          meanings: [{
            partOfSpeech: '',
            definitions: [{
              definition: 'Không tìm thấy từ này trong từ điển.'
            }]
          }],
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching dictionary data:', error);
      setDictionaryResult({
        word: selectedText,
        meanings: [{
          partOfSpeech: '',
          definitions: [{
            definition: 'Lỗi khi tìm kiếm từ điển.'
          }]
        }],
        loading: false
      });
    }
  };

  // Thêm hàm tìm từ tại vị trí chạm
  const findWordAtPosition = (element: HTMLElement, x: number, y: number): string | null => {
    // Lấy nội dung văn bản của phần tử
    const text = element.textContent || '';
    
    // Nếu phần tử không có văn bản, trả về null
    if (!text.trim()) return null;
    
    // Tính toán vị trí tương đối trong phần tử
    const rect = element.getBoundingClientRect();
    const relativeX = x - rect.left;
    
    // Ước tính vị trí ký tự dựa trên vị trí chạm
    // Giả định mỗi ký tự có chiều rộng trung bình
    const avgCharWidth = rect.width / text.length;
    const charIndex = Math.floor(relativeX / avgCharWidth);
    
    // Đảm bảo index nằm trong giới hạn
    const safeIndex = Math.max(0, Math.min(charIndex, text.length - 1));
    
    // Tìm từ chứa ký tự tại vị trí đã tính
    // Từ được định nghĩa là chuỗi ký tự liên tục không chứa khoảng trắng
    let startIndex = safeIndex;
    let endIndex = safeIndex;
    
    // Tìm điểm bắt đầu của từ
    while (startIndex > 0 && !/\s/.test(text[startIndex - 1])) {
      startIndex--;
    }
    
    // Tìm điểm kết thúc của từ
    while (endIndex < text.length - 1 && !/\s/.test(text[endIndex + 1])) {
      endIndex++;
    }
    
    // Trích xuất từ
    const word = text.substring(startIndex, endIndex + 1).trim();
    
    // Loại bỏ dấu câu đầu và cuối từ
    return word.replace(/^[.,;:!?()[\]{}'"]+|[.,;:!?()[\]{}'"]+$/g, '');
  };
  
  // Xử lý click vào từ để hiển thị từ điển (chỉ cho iOS/iPadOS)
  const handleWordClick = async (e: React.MouseEvent) => {
    // Chỉ xử lý nếu thiết bị là iOS/iPadOS
    if (!isIOS && !isIPad) return;
    
    if (e.target instanceof HTMLElement) {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      // Nếu đã có text được chọn, sử dụng text đó
      if (selectedText && selectedText.length > 0) {
        await showDictionaryPopup(selectedText, e.clientX, e.clientY);
      } else {
        // Nếu không có text được chọn, tìm từ tại vị trí click
        const element = e.target;
        if (element && element.textContent) {
          const word = findWordAtPosition(element, e.clientX, e.clientY);
          
          if (word) {
            await showDictionaryPopup(word, e.clientX, e.clientY);
          }
        }
      }
    }
  };
  
  // Thêm lại hàm handleWordDoubleClick
  const handleWordDoubleClick = async (e: React.MouseEvent) => {
    // Kiểm tra xem có phải double click vào text không
    if (e.target instanceof HTMLElement) {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      
      if (selectedText && selectedText.length > 0) {
        await showDictionaryPopup(selectedText, e.clientX, e.clientY);
      }
    }
  };

  // Thêm hàm xử lý touch start cho long press
  const handleTouchStart = (e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    
    // Bắt đầu đếm thời gian để xác định long press (500ms)
    const timer = setTimeout(() => {
      // Ngăn chặn hành vi mặc định của trình duyệt (menu ngữ cảnh)
      e.preventDefault();
      
      // Lấy phần tử được chạm vào
      const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
      
      if (element && element.textContent) {
        // Tìm từ gần nhất với vị trí chạm
        const word = findWordAtPosition(element, touch.clientX, touch.clientY);
        
        if (word) {
          // Hiển thị từ điển cho từ đã tìm thấy
          showDictionaryPopup(word, touch.clientX, touch.clientY);
        }
      }
    }, 500);
    
    setLongPressTimer(timer);
  };
  
  // Thêm hàm xử lý touch end để hủy long press và ngăn chặn hành vi mặc định
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  // Thêm hàm xử lý touch move để hủy long press nếu di chuyển
  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer) {
      const touch = e.touches[0];
      const moveThreshold = 10; // Ngưỡng di chuyển để hủy long press
      
      // Nếu di chuyển quá ngưỡng, hủy long press
      if (
        Math.abs(touch.clientX - touchStartPos.x) > moveThreshold ||
        Math.abs(touch.clientY - touchStartPos.y) > moveThreshold
      ) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    }
  };

  // Đóng popup từ điển khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dictionaryRef.current && !dictionaryRef.current.contains(event.target as Node)) {
        setShowDictionary(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Hàm lấy tiến độ học tập của người dùng
  const fetchUserProgress = async () => {
    if (!user || !lessonId) return;
    
    try {
      console.log('Đang lấy tiến độ học tập cho:', {
        firebase_uid: user.uid,
        lesson_id: lessonId
      });
      
      const response = await fetch(`/api/writingcheck/progress?firebase_uid=${user.uid}&lesson_id=${lessonId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Lỗi khi lấy tiến độ học tập:', errorData);
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      console.log('Kết quả lấy tiến độ học tập:', data);
      
      if (data && data.length > 0) {
        setUserProgress(data[0]);
        // Nếu có tiến độ, cập nhật currentIndex
        setCurrentIndex(data[0].current_sentence);
        console.log('Đã cập nhật currentIndex:', data[0].current_sentence);
      }
    } catch (error) {
      console.error('Lỗi khi lấy tiến độ học tập:', error);
    }
  };

  // Hàm cập nhật tiến độ học tập
  const updateUserProgress = async (sentenceIndex: number, isCompleted: boolean = false) => {
    if (!user || !lessonId) return;
    
    try {
      console.log('Cập nhật tiến độ:', {
        firebase_uid: user.uid,
        lesson_id: Number(lessonId),
        current_sentence: sentenceIndex,
        completed: isCompleted
      });
      
      const response = await fetch('/api/writingcheck/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: user.uid,
          lesson_id: Number(lessonId),
          current_sentence: sentenceIndex,
          completed: isCompleted
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Lỗi khi cập nhật tiến độ:', errorData);
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      console.log('Kết quả cập nhật tiến độ:', data);
      setUserProgress(data);
    } catch (error) {
      console.error('Lỗi khi cập nhật tiến độ học tập:', error);
    }
  };

  useEffect(() => {
    if (!lessonId) return;
    const fetchLesson = async () => {
      try {
        const res = await fetch(`/api/admin/writinglesson/${lessonId}`);
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await res.json();
        if (!data || !Array.isArray(data.sentences)) {
          alert(data?.error || 'Không tìm thấy bài viết hoặc dữ liệu không hợp lệ!');
          return;
        }
        const mappedSentences = data.sentences.map((s: any) => ({
          ...s,
          answerKey: s.answer_key
        }));
        setLesson({ ...data, sentences: mappedSentences });
        setInputs(Array(data.sentences.length).fill(''));
        setFeedbacks(Array(data.sentences.length).fill(null));
        
        // Lấy tiến độ học tập sau khi đã lấy thông tin bài học
        if (user) {
          await fetchUserProgress();
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin bài học:', error);
        alert('Có lỗi xảy ra khi tải bài học');
      }
    };
    fetchLesson();
  }, [lessonId, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInputs = [...inputs];
    newInputs[currentIndex] = e.target.value;
    setInputs(newInputs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson || !inputs[currentIndex].trim()) return;
    setIsSubmitting(true);
    setIsLoading(true);
    try {
      const sentence = lesson.sentences[currentIndex];
      const payload = {
        lessonId: lesson.id,
        sentenceId: sentence.id,
        userAnswer: inputs[currentIndex].trim(),
        originalSentence: sentence.vietnamese_text,
        answerKey: sentence.answerKey || '',
        lessonType: lesson.type || 'EMAILS',
        lessonLevel: lesson.level || 'BEGINNER'
      };
      const response = await fetch('/api/writingcheck/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const newFeedbacks = [...feedbacks];
      newFeedbacks[currentIndex] = data;
      setFeedbacks(newFeedbacks);
    } catch (error) {
      alert('Có lỗi xảy ra khi gửi câu trả lời');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  // Xử lý phím Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Nếu chưa có feedback cho câu hiện tại, submit
      if (!feedbacks[currentIndex]) {
        handleSubmit(e as any);
      } else {
        // Nếu đã có feedback, chuyển sang câu tiếp theo
        handleNext();
      }
    }
  };

  // Hàm rewrite - làm lại câu hiện tại
  const handleRewrite = () => {
    const newInputs = [...inputs];
    newInputs[currentIndex] = '';
    setInputs(newInputs);
    
    const newFeedbacks = [...feedbacks];
    newFeedbacks[currentIndex] = null;
    setFeedbacks(newFeedbacks);
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Hàm chuyển sang câu tiếp theo
  const handleNext = () => {
    if (currentIndex < (lesson?.sentences.length || 1) - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Cập nhật tiến độ học tập
      updateUserProgress(nextIndex, nextIndex === (lesson?.sentences.length || 1) - 1);
      
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Đã hoàn thành tất cả câu
      updateUserProgress(currentIndex, true);
    }
  };

  // Hàm chuyển về câu trước
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (!lesson) return <div className="text-white text-center mt-10">Đang tải bài viết...</div>;

  const totalSentences = lesson.sentences.length;
  const progress = feedbacks.filter(fb => fb).length;
  const sentence = lesson.sentences[currentIndex];

  return (
    <div className="min-h-screen bg-[#10131a] py-8 px-4 sm:px-6 lg:px-8">
      {/* Dictionary popup */}
      {showDictionary && dictionaryResult && (
        <div 
          ref={dictionaryRef}
          className="fixed bg-[#232733] rounded-lg shadow-xl border border-gray-700 z-50 w-80"
          style={{ 
            top: `${dictionaryPosition.y}px`, 
            left: `${dictionaryPosition.x}px`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          <div 
            className="p-3 border-b border-gray-700 flex justify-between items-center cursor-grab"
            onMouseDown={handleDragStart}
          >
            <div>
              <h3 className="text-yellow-400 font-bold text-lg">{dictionaryResult.word}</h3>
              {dictionaryResult.phonetic && (
                <div className="text-gray-400 text-sm">{dictionaryResult.phonetic}</div>
              )}
              {dictionaryResult.vietnameseTranslation && (
                <div className="text-green-400 text-sm mt-1">
                  {dictionaryResult.vietnameseTranslation}
                </div>
              )}
            </div>
            <div className="flex items-center">
              <button
                onClick={() => window.open(`https://dictionary.cambridge.org/dictionary/english/${dictionaryResult.word}`, '_blank')}
                title="Mở trong Cambridge Dictionary"
                className="text-blue-400 hover:text-blue-300 mr-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
                  <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
                </svg>
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!user) {
                      alert('Bạn cần đăng nhập để lưu từ vào danh sách học tập');
                      return;
                    }
                    
                    // Xác định part_of_speech từ data nếu có
                    let partOfSpeech = null;
                    if (dictionaryResult.meanings && dictionaryResult.meanings.length > 0) {
                      partOfSpeech = dictionaryResult.meanings[0].partOfSpeech || null;
                    }
                    
                    // Gọi API để lưu từ vào danh sách học tập
                    const response = await fetch('/api/vocab', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'firebase_uid': user.uid
                      },
                      body: JSON.stringify({
                        vocab: dictionaryResult.word,
                        meaning: dictionaryResult.vietnameseTranslation || 
                                (dictionaryResult.meanings[0]?.definitions[0]?.definition || ''),
                        part_of_speech: partOfSpeech,
                        level_en: 0,
                        level_vi: 0
                      })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                      alert(`Đã lưu từ "${dictionaryResult.word}" vào danh sách học tập`);
                    } else {
                      if (result.isDuplicate) {
                        alert(`Từ "${dictionaryResult.word}" đã tồn tại trong danh sách học tập`);
                      } else {
                        alert(`Lỗi khi lưu từ: ${result.error || 'Không xác định'}`);
                      }
                    }
                  } catch (error) {
                    console.error('Error saving vocabulary:', error);
                    alert('Có lỗi xảy ra khi lưu từ vào danh sách học tập');
                  }
                }}
                title="Lưu từ vào danh sách học tập"
                className="text-yellow-400 hover:text-yellow-300 mr-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4z"/>
                </svg>
              </button>
              <button 
                onClick={() => setShowDictionary(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-3 max-h-72 overflow-y-auto">
            {dictionaryResult.loading ? (
              <div className="flex justify-center py-3">
                <span className="animate-spin h-6 w-6 border-2 border-white border-t-yellow-400 rounded-full"></span>
              </div>
            ) : (
              dictionaryResult.meanings.map((meaning, idx) => (
                <div key={idx} className="mb-3">
                  {meaning.partOfSpeech && (
                    <div className="text-blue-400 text-sm font-semibold mb-1">{meaning.partOfSpeech}</div>
                  )}
                  <ul className="text-sm text-gray-200 space-y-3">
                    {meaning.definitions.slice(0, 3).map((def, defIdx) => (
                      <li key={defIdx}>
                        <div className="leading-relaxed">{def.definition}</div>
                        {def.example && (
                          <div className="text-gray-400 mt-1 italic text-sm">"{def.example}"</div>
                        )}
                        {def.synonyms && def.synonyms.length > 0 && (
                          <div className="mt-1 text-sm">
                            <span className="text-gray-400">Đồng nghĩa: </span>
                            <span className="text-blue-300">{def.synonyms.slice(0, 3).join(', ')}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400 drop-shadow">{lesson.title}</h1>
          <div className="text-gray-300 text-sm font-semibold">
            Progress: {progress}/{totalSentences} sentences
          </div>
        </div>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-400 transition-all" style={{ width: `${(progress / totalSentences) * 100}%` }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex gap-8">
        {/* Cột trái - 2/3 */}
        <div className="flex-1">
          <div className="bg-[#232733] rounded-xl p-8 shadow-lg">
            <div className="text-pink-300 font-bold text-lg mb-4">Câu {currentIndex + 1} / {totalSentences}</div>
            
            {/* Full văn bản tiếng Việt */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">Văn bản tiếng Việt:</h3>
              <div className="bg-[#181b22] rounded-lg p-4 text-white text-lg leading-relaxed whitespace-pre-wrap">
                {lesson.content.split(/(?<=[.!?])\s+/).map((sentence, index) => {
                  const trimmedSentence = sentence.trim();
                  const isCurrentSentence = lesson.sentences[currentIndex]?.vietnamese_text === trimmedSentence;
                  const currentFeedback = feedbacks[currentIndex];
                  
                  // Xác định màu highlight dựa trên accuracy
                  let highlightClass = '';
                  if (isCurrentSentence && currentFeedback) {
                    const accuracy = currentFeedback.accuracy;
                    if (accuracy >= 76) {
                      highlightClass = 'bg-green-400 text-[#181b22] px-2 py-1 rounded font-semibold';
                    } else if (accuracy >= 51) {
                      highlightClass = 'bg-yellow-400 text-[#181b22] px-2 py-1 rounded font-semibold';
                    } else {
                      highlightClass = 'bg-red-400 text-white px-2 py-1 rounded font-semibold';
                    }
                  } else if (isCurrentSentence) {
                    highlightClass = 'bg-yellow-400 text-[#181b22] px-2 py-1 rounded font-semibold';
                  }
                  
                  return (
                    <span
                      key={index}
                      className={`inline ${highlightClass}`}
                    >
                      {sentence}
                      {index < lesson.content.split(/(?<=[.!?])\s+/).length - 1 && ' '}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Ô nhập liệu */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-white font-semibold mb-2 block">Nhập bản dịch tiếng Anh:</label>
                <textarea
                  ref={inputRef}
                  className="w-full p-4 rounded-lg text-base border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-[#181b22] text-white min-h-[120px] resize-none"
                  placeholder="Nhập bản dịch tiếng Anh cho câu này..."
                  value={inputs[currentIndex]}
                  onChange={handleInputChange}
                  disabled={isSubmitting || !!feedbacks[currentIndex]}
                  autoFocus
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="flex gap-2 items-center justify-between">
                <button type="button" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg" onClick={() => router.push('/writingcheck/list')}>← Quit</button>
                <div className="flex gap-2">
                  {feedbacks[currentIndex] && (
                    <button type="button" className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-6 rounded-lg" onClick={handleRewrite}>Rewrite</button>
                  )}
                  {feedbacks[currentIndex] ? (
                    <button 
                      type="button" 
                      className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-8 rounded-lg flex items-center gap-2" 
                      onClick={handleNext}
                      disabled={currentIndex === totalSentences - 1}
                    >
                      Next →
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-2 px-8 rounded-lg flex items-center gap-2" 
                      disabled={!inputs[currentIndex].trim() || isSubmitting}
                    >
                      {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-yellow-400 rounded-full inline-block"></span> : 'Submit'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Cột phải - 1/3 */}
        <div className="w-1/3">
          <div className="sticky top-8 space-y-6">
            {/* Accuracy */}
            <div className="bg-[#232733] rounded-xl p-6 shadow-lg">
              <h3 className="text-white font-bold text-lg mb-4">Accuracy</h3>
              {feedbacks[currentIndex] ? (
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getAccuracyColor(feedbacks[currentIndex]?.accuracy || 0)}`}>
                    {feedbacks[currentIndex]?.accuracy}%
                  </div>
                  <div className="text-gray-300 text-sm">
                    {getAccuracyRating(feedbacks[currentIndex]?.accuracy || 0)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  Submit your answer to see accuracy
                </div>
              )}
            </div>

            {/* Feedback */}
            <div className="bg-[#232733] rounded-xl p-6 shadow-lg">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center justify-between">
                <span>Feedback</span>
                <span className="text-xs text-gray-400">
                  {isIOS || isIPad 
                    ? "Chạm vào từ để tra từ điển" 
                    : "Double-click hoặc nhấn giữ để tra từ điển"}
                </span>
              </h3>
              {isLoading ? (
                <div className="text-center py-8">
                  <span className="animate-spin h-8 w-8 border-4 border-white border-t-yellow-400 rounded-full inline-block"></span>
                  <div className="text-gray-400 mt-2">Đang chấm điểm...</div>
                </div>
              ) : feedbacks[currentIndex] ? (
                <div 
                  className="space-y-4 text-sm" 
                  onDoubleClick={handleWordDoubleClick}
                  onClick={handleWordClick}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                >
                  {feedbacks[currentIndex]?.corrected_version && (
                    <div>
                      <span className="font-bold text-green-400">Corrected:</span>
                      <div className="text-gray-200 mt-1">
                        <span dangerouslySetInnerHTML={{ __html: highlightEnglishWords(feedbacks[currentIndex]?.corrected_version || '') }} />
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-yellow-400">Feedback:</span>
                    <div className="text-gray-200 mt-1">
                      <span dangerouslySetInnerHTML={{ __html: highlightEnglishWords(feedbacks[currentIndex]?.feedback || '') }} />
                    </div>
                  </div>
                  {feedbacks[currentIndex]?.errors && feedbacks[currentIndex]?.errors.length > 0 && (
                    <div>
                      <span className="font-bold text-red-400">Errors:</span>
                      <ul className="list-disc ml-4 text-red-300 mt-1">
                        {feedbacks[currentIndex]?.errors.map((err, idx) => (
                          <li key={idx} dangerouslySetInnerHTML={{ __html: highlightEnglishWords(err) }} />
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedbacks[currentIndex]?.suggestions && feedbacks[currentIndex]?.suggestions.length > 0 && (
                    <div>
                      <span className="font-bold text-blue-400">Suggestions:</span>
                      <ul className="list-disc ml-4 text-blue-300 mt-1">
                        {feedbacks[currentIndex]?.suggestions.map((sug, idx) => (
                          <li key={idx} dangerouslySetInnerHTML={{ __html: highlightEnglishWords(sug) }} />
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedbacks[currentIndex]?.advice && (
                    <div>
                      <span className="font-bold text-yellow-400">Advice:</span>
                      <div className="text-gray-200 mt-1">
                        <span dangerouslySetInnerHTML={{ __html: highlightEnglishWords(feedbacks[currentIndex]?.advice || '') }} />
                      </div>
                    </div>
                  )}
                  {feedbacks[currentIndex]?.vocabulary_analysis && feedbacks[currentIndex]?.vocabulary_analysis.length > 0 && (
                    <div>
                      <span className="font-bold text-purple-400">Phân tích từ vựng:</span>
                      <div className="mt-2 space-y-3">
                        {feedbacks[currentIndex]?.vocabulary_analysis.map((item, idx) => (
                          <div key={idx} className="bg-[#1a1d27] p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-base text-white font-semibold">{item.word}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                item.current_band === 'C2' || item.current_band === 'C1' ? 'bg-purple-500 text-white' :
                                item.current_band === 'B2' || item.current_band === 'B1' ? 'bg-blue-500 text-white' :
                                'bg-gray-500 text-white'
                              }`}>
                                Band {item.current_band}
                              </span>
                            </div>
                            {item.suggested_alternatives && item.suggested_alternatives.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xm text-gray-400 mb-1">Từ vựng cao cấp hơn:</div>
                                <div className="flex flex-wrap gap-2">
                                  {item.suggested_alternatives.map((alt, altIdx) => (
                                    <div key={altIdx} className="text-xm bg-[#232733] px-2 py-1 rounded flex items-center">
                                      <span className="text-base text-green-300">{alt.word}</span>
                                      <span className="ml-1 text-xm px-1.5 rounded bg-green-700 text-white">{alt.band}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  Submit your answer to see feedback
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticePage; 