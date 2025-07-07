import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import useRequireAuth from '@/hooks/useRequireAuth';
import { isIOSDevice, isIPadDevice } from '@/utils/deviceDetection';

interface Submission {
  id: number;
  lessonId: number;
  sentenceId: number;
  userAnswer: string;
  originalSentence: string;
  score: number;
  feedback: string;
  errors: string[];
  suggestions: string[];
  correctedVersion: string;
  advice: string;
  created_at: string;
  vocabulary_analysis?: {
    word: string;
    current_band: string;
    suggested_alternatives: {
      word: string;
      band: string;
    }[];
  }[];
  lesson: {
    id: number;
    title: string;
    level: string;
    type: string;
  };
  sentence: {
    id: number;
    vietnamese: string;
    sentenceOrder: number;
  };
}

interface HistoryData {
  submissions: Submission[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats: {
    averageScore: number;
    totalSubmissions: number;
    minScore: number;
    maxScore: number;
  };
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

const HistoryPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  useRequireAuth();
  
  const [isIOS, setIsIOS] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsIOS(isIOSDevice());
      setIsIPad(isIPadDevice());
    }
  }, []);
  
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  
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

  useEffect(() => {
    fetchHistory();
  }, [currentPage, selectedLesson]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '10',
        offset: ((currentPage - 1) * 10).toString()
      });
      
      if (selectedLesson) {
        params.append('lessonId', selectedLesson);
      }

      const response = await fetch(`/api/writingcheck/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-green-500';
      case 'INTERMEDIATE': return 'bg-yellow-500';
      case 'ADVANCED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'EMAILS': return 'bg-blue-500';
      case 'DIARIES': return 'bg-purple-500';
      case 'ESSAYS': return 'bg-indigo-500';
      case 'ARTICLES': return 'bg-teal-500';
      case 'STORIES': return 'bg-pink-500';
      case 'REPORTS': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#10131a] flex items-center justify-center">
        <div className="text-white text-xl">Đang tải lịch sử...</div>
      </div>
    );
  }

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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
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
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">Lịch sử luyện tập Writing</h1>
          
          {/* Thống kê tổng quan */}
          {historyData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#181b22] rounded-xl p-4">
                <div className="text-gray-400 text-sm">Tổng số bài nộp</div>
                <div className="text-2xl font-bold text-white">{historyData.stats.totalSubmissions}</div>
              </div>
              <div className="bg-[#181b22] rounded-xl p-4">
                <div className="text-gray-400 text-sm">Điểm trung bình</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {historyData.stats.averageScore.toFixed(1)}/10
                </div>
              </div>
              <div className="bg-[#181b22] rounded-xl p-4">
                <div className="text-gray-400 text-sm">Điểm cao nhất</div>
                <div className="text-2xl font-bold text-green-400">{historyData.stats.maxScore}/10</div>
              </div>
              <div className="bg-[#181b22] rounded-xl p-4">
                <div className="text-gray-400 text-sm">Điểm thấp nhất</div>
                <div className="text-2xl font-bold text-red-400">{historyData.stats.minScore}/10</div>
              </div>
            </div>
          )}
        </div>

        {/* Danh sách lịch sử */}
        <div className="bg-[#181b22] rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-[#232733] flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Chi tiết bài nộp</h2>
            <div className="text-xs text-gray-400">
              {isIOS || isIPad 
                ? "Chạm vào từ để tra từ điển" 
                : "Double-click hoặc nhấn giữ để tra từ điển"}
            </div>
          </div>
          
          {historyData?.submissions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-lg">Chưa có bài nộp nào</div>
              <button
                onClick={() => router.push('/writingcheck/list')}
                className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-2 px-6 rounded-lg"
              >
                Bắt đầu luyện tập
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#232733]">
              {historyData?.submissions.map((submission) => (
                <div 
                  key={submission.id} 
                  className="p-6 hover:bg-[#232733] transition-colors" 
                  onDoubleClick={handleWordDoubleClick}
                  onClick={handleWordClick}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Thông tin bài học */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{submission.lesson.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getLevelBadgeColor(submission.lesson.level)}`}>
                          {submission.lesson.level}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getTypeBadgeColor(submission.lesson.type)}`}>
                          {submission.lesson.type}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-400 mb-2">
                        Câu {submission.sentence.sentenceOrder} • {new Date(submission.created_at).toLocaleString('vi-VN')}
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400 text-sm">Câu gốc:</span>
                          <div className="text-white text-sm mt-1">{submission.originalSentence}</div>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Bản dịch của bạn:</span>
                          <div className="text-white text-sm mt-1">{submission.userAnswer}</div>
                        </div>
                        {submission.correctedVersion && (
                          <div>
                            <span className="text-green-400 text-sm">Bản dịch đúng:</span>
                            <div className="text-green-300 text-sm mt-1">{submission.correctedVersion}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Điểm số và phản hồi */}
                    <div className="lg:w-80">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm">Điểm số:</span>
                        <span className={`text-2xl font-bold ${getScoreColor(submission.score)}`}>
                          {submission.score}/10
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-300 mb-3">
                        {submission.feedback}
                      </div>
                      
                      {/* Lỗi và gợi ý */}
                      {submission.errors.length > 0 && (
                        <div className="mb-2">
                          <div className="text-red-400 text-xs font-semibold mb-1">Lỗi:</div>
                          <ul className="text-xs text-red-300 space-y-1">
                            {submission.errors.slice(0, 2).map((error, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-red-400 mr-1">•</span>
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {submission.suggestions.length > 0 && (
                        <div>
                          <div className="text-blue-400 text-xs font-semibold mb-1">Gợi ý:</div>
                          <ul className="text-xs text-blue-300 space-y-1">
                            {submission.suggestions.slice(0, 2).map((suggestion, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-blue-400 mr-1">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {submission.vocabulary_analysis && submission.vocabulary_analysis.length > 0 && (
                        <div className="mt-3">
                          <div className="text-purple-400 text-xs font-semibold mb-1">Phân tích từ vựng:</div>
                          <div className="space-y-2">
                            {submission.vocabulary_analysis.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="bg-[#1a1d27] p-2 rounded-lg text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white font-semibold">{item.word}</span>
                                  <span className={`text-xs px-1 py-0.5 rounded ${
                                    item.current_band === 'C2' || item.current_band === 'C1' ? 'bg-purple-500 text-white' :
                                    item.current_band === 'B2' || item.current_band === 'B1' ? 'bg-blue-500 text-white' :
                                    'bg-gray-500 text-white'
                                  }`}>
                                    Band {item.current_band}
                                  </span>
                                </div>
                                {item.suggested_alternatives && item.suggested_alternatives.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.suggested_alternatives.slice(0, 2).map((alt, altIdx) => (
                                      <div key={altIdx} className="text-xs bg-[#232733] px-1.5 py-0.5 rounded flex items-center">
                                        <span className="text-green-300">{alt.word}</span>
                                        <span className="ml-1 text-xs px-1 rounded bg-green-700 text-white">{alt.band}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Phân trang */}
          {historyData && historyData.pagination.total > 0 && (
            <div className="p-6 border-t border-[#232733] flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                Hiển thị {historyData.pagination.offset + 1}-{Math.min(historyData.pagination.offset + historyData.pagination.limit, historyData.pagination.total)} 
                trong tổng số {historyData.pagination.total} bài nộp
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-[#232733] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2d3a]"
                >
                  Trước
                </button>
                <span className="px-3 py-1 bg-yellow-400 text-[#181b22] rounded font-semibold">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!historyData.pagination.hasMore}
                  className="px-3 py-1 bg-[#232733] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2d3a]"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage; 