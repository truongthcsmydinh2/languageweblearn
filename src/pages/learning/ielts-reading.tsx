import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
import Layout from '@/components/common/Layout';

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
  question_type: 'multiple_choice' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'diagram_labelling' | 'short_answer_questions';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  order_index: number;
  group_id?: string;
}

interface QuestionGroup {
  id: string;
  instructions: string;
  question_type: string;
  display_order: number;
  questions: Question[];
}

// Thêm icon SVG đơn giản cho dịch và highlight
const TranslateIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M3 5h18M9 3v2m6-2v2m-9 4h12M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 17l4-4m0 0l-4-4m4 4H8" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const HighlightIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 20h16M9 4h6l1 7H8l1-7zm2 7v5m2-5v5" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const HIGHLIGHT_COLORS = [
  '#fef08a', // vàng nhạt
  '#a7f3d0', // xanh mint
  '#bae6fd', // xanh dương nhạt
  '#fbcfe8', // hồng nhạt
  '#fca5a5', // đỏ nhạt
  '#fdba74', // cam nhạt
  '#ddd6fe', // tím nhạt
];

const IeltsReadingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [readingPanelWidth, setReadingPanelWidth] = useState(50); // %
  const [isDragging, setIsDragging] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{[key: number]: boolean}>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
  
  // Font size adjustment
  const [readingFontSize, setReadingFontSize] = useState(16); // Default reading font size in px
  const [questionFontSize, setQuestionFontSize] = useState(16); // Default question font size in px
  
  const [testResults, setTestResults] = useState({
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    timeTaken: 0
  });

  const [hideNavbar, setHideNavbar] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [pendingPassage, setPendingPassage] = useState<Passage | null>(null);
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);

  // State cho floating toolbar dịch & highlight
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [selectedText, setSelectedText] = useState('');
  const [translateResult, setTranslateResult] = useState<string | null>(null);
  const [showTranslatePopup, setShowTranslatePopup] = useState(false);
  const readingContentRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPos, setColorPickerPos] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [highlightedRanges, setHighlightedRanges] = useState<{start: number, end: number, color: string}[]>([]);

  // Thêm state cho vị trí popup dịch
  const [translatePopupPos, setTranslatePopupPos] = useState<{x: number, y: number} | null>(null);
  const [draggingTranslate, setDraggingTranslate] = useState(false);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({x: 0, y: 0});

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    fetchPassages();
  }, [user, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTestActive && isTimerEnabled && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isTestActive && isTimerEnabled && timeLeft === 0) {
      finishTest();
    }
    return () => clearTimeout(timer);
  }, [isTestActive, isTimerEnabled, timeLeft]);
  
  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs.current).forEach(([questionId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdowns(prev => ({
            ...prev,
            [questionId]: false
          }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Xử lý full screen
  useEffect(() => {
    const handleFullScreenChange = () => {
      const isFs = !!(document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement);
      setIsFullScreen(isFs);
      setHideNavbar(isFs);
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).mozRequestFullScreen) {
        (document.documentElement as any).mozRequestFullScreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        (document.documentElement as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  const adjustFontSize = (type: 'reading' | 'question', increment: boolean) => {
    if (type === 'reading') {
      setReadingFontSize(prev => {
        const newSize = increment ? prev + 1 : prev - 1;
        return Math.min(Math.max(newSize, 12), 24); // Min 12px, max 24px
      });
    } else {
      setQuestionFontSize(prev => {
        const newSize = increment ? prev + 1 : prev - 1;
        return Math.min(Math.max(newSize, 12), 24); // Min 12px, max 24px
      });
    }
  };

  const toggleDropdown = (questionId: number) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

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

  const handleStartTestClick = (passage: Passage) => {
    setPendingPassage(passage);
    setShowTimerModal(true);
  };

  const handleTimerChoice = (enable: boolean) => {
    setIsTimerEnabled(enable);
    setShowTimerModal(false);
    if (pendingPassage) {
      startTest(pendingPassage, enable);
      setPendingPassage(null);
    }
  };

  const startTest = async (passage: Passage, enableTimer: boolean = true) => {
    try {
      const response = await fetch(`/api/ielts-reading/questions/${passage.id}`);
      if (response.ok) {
        const data = await response.json();
        
        // Nhóm câu hỏi theo group_id (nếu có)
        // Trong trường hợp API trả về cấu trúc cũ, chúng ta sẽ cần xử lý dữ liệu
        if (data.questions && Array.isArray(data.questions)) {
          // Tạo một group mặc định nếu API không trả về theo nhóm
          setQuestionGroups([
            {
              id: 'default',
              instructions: 'Answer the following questions',
              question_type: 'mixed',
              display_order: 1,
              questions: data.questions
            }
          ]);
        } else if (data.groups && Array.isArray(data.groups)) {
          // Nếu API trả về cấu trúc mới
          setQuestionGroups(data.groups);
        }
        
        setSelectedPassage(passage);
        setUserAnswers({});
        setTimeLeft(enableTimer ? passage.time_limit * 60 : 0);
        setIsTestActive(true);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Close dropdown after selection
    setOpenDropdowns(prev => ({
      ...prev,
      [questionId]: false
    }));
  };

  const finishTest = async () => {
    // Tính toán số câu đúng từ tất cả các nhóm
    const allQuestions = questionGroups.flatMap(group => group.questions);
    
    const correctAnswers = allQuestions.reduce((count, question) => {
      const userAnswer = userAnswers[question.id];
      return count + (userAnswer === question.correct_answer ? 1 : 0);
    }, 0);

    const results = {
      score: Math.round((correctAnswers / allQuestions.length) * 100),
      totalQuestions: allQuestions.length,
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

  // Render các lựa chọn đáp án dựa vào loại câu hỏi
  const renderQuestionOptions = (question: Question, groupType: string) => {
    const userAnswer = userAnswers[question.id] || '';
    
    switch (groupType) {
      case 'true_false_not_given':
    return (
                  <div className="space-y-3">
            {['TRUE', 'FALSE', 'NOT GIVEN'].map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                  name={`question-${question.id}`}
                          value={option}
                          checked={userAnswer === option}
                  onChange={() => handleAnswer(question.id, option)}
                          className="text-primary-200 focus:ring-primary-200"
                        />
                        <span className="text-gray-200">{option}</span>
                      </label>
                    ))}
                  </div>
        );

      case 'yes_no_not_given':
        return (
                  <div className="space-y-3">
            {['YES', 'NO', 'NOT GIVEN'].map((option) => (
                      <label key={option} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                  name={`question-${question.id}`}
                          value={option}
                          checked={userAnswer === option}
                  onChange={() => handleAnswer(question.id, option)}
                          className="text-primary-200 focus:ring-primary-200"
                        />
                        <span className="text-gray-200">{option}</span>
                      </label>
            ))}
          </div>
        );
      
      case 'multiple_choice':
        return (
          <div 
            className="relative" 
            ref={(el) => {
              if (el) dropdownRefs.current[question.id] = el;
              else delete dropdownRefs.current[question.id];
            }}
          >
            <button
              onClick={() => toggleDropdown(question.id)}
              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200 flex justify-between items-center"
            >
              <span>{userAnswer || "Chọn câu trả lời..."}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {openDropdowns[question.id] && (
              <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-500 rounded-lg shadow-lg max-h-60 overflow-auto">
                {question.options && question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(question.id, option)}
                    className={`block w-full text-left px-4 py-3 hover:bg-gray-600 ${userAnswer === option ? 'bg-gray-600' : ''}`}
                  >
                    <span className="text-gray-200">{option}</span>
                  </button>
                    ))}
                  </div>
                )}
          </div>
        );
      
      case 'sentence_completion':
      case 'summary_completion':
      case 'note_completion':
      case 'table_completion':
      case 'flow_chart_completion':
      case 'diagram_labelling':
      case 'short_answer_questions':
        return (
          <div>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary-200 focus:border-transparent"
              placeholder="Nhập câu trả lời..."
            />
          </div>
        );
      
      default:
        return (
                  <div>
                    <input
                      type="text"
              value={userAnswer}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200 focus:ring-2 focus:ring-primary-200 focus:border-transparent"
                      placeholder="Nhập câu trả lời..."
                    />
                  </div>
        );
    }
  };

  // Modal chọn chế độ tính giờ luôn luôn render ở ngoài cùng
  const timerModal = (
    <Modal isOpen={showTimerModal} onClose={() => setShowTimerModal(false)} title="Chọn chế độ làm bài">
      <div className="p-6">
        <p className="text-lg text-gray-100 mb-6">Bạn có muốn tính giờ cho bài làm này không?</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => handleTimerChoice(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-lg"
          >
            Có, hãy tính giờ
          </button>
          <button
            onClick={() => handleTimerChoice(false)}
            className="px-6 py-3 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 font-semibold text-lg"
          >
            Không, làm tự do
          </button>
        </div>
      </div>
    </Modal>
  );

  // Khóa cuộn body khi làm bài
  useEffect(() => {
    if (isTestActive) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isTestActive]);

  // Logic splitter kéo chỉnh width hai panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth >= 30 && newWidth <= 70) {
        setReadingPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Lắng nghe selection trong panel bài đọc
  useEffect(() => {
    const handleSelection = () => {
      if (!readingContentRef.current) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setShowToolbar(false);
        setShowTranslatePopup(false);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!readingContentRef.current.contains(range.commonAncestorContainer)) {
        setShowToolbar(false);
        setShowTranslatePopup(false);
        return;
      }
      const rect = range.getBoundingClientRect();
      setToolbarPos({
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 40 // phía trên selection
      });
      setSelectedText(selection.toString());
      setShowToolbar(true);
      setShowTranslatePopup(false);
    };
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    // Ẩn toolbar khi click ra ngoài
    const handleClick = (e: MouseEvent) => {
      if (!readingContentRef.current) return;
      // Nếu click vào popup dịch thì không ẩn
      const translatePopup = document.querySelector('[data-translate-popup]');
      if (translatePopup && translatePopup.contains(e.target as Node)) return;
      if (!readingContentRef.current.contains(e.target as Node)) {
        setShowToolbar(false);
        setShowTranslatePopup(false);
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  // Gửi API Gemini để dịch
  const handleTranslate = async () => {
    if (!selectedText) return;
    setTranslateResult('Đang dịch...');
    setShowTranslatePopup(true);
    try {
      const res = await fetch('/api/admin/translate-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ englishText: selectedText })
      });
      const data = await res.json();
      setTranslateResult(data.translatedText || 'Không nhận được bản dịch');
    } catch {
      setTranslateResult('Lỗi khi dịch');
    }
  };

  // Highlight đoạn text đã chọn
  const handleHighlight = () => {
    if (!selectedText || !readingContentRef.current) return;
    const content = readingContentRef.current.innerText;
    const start = content.indexOf(selectedText);
    if (start === -1) return;
    const end = start + selectedText.length;
    setColorPickerPos({
      x: toolbarPos.x,
      y: toolbarPos.y + 36
    });
    setShowColorPicker(true);
    setShowToolbar(false);
    setShowTranslatePopup(false);
  };

  // Khi chọn màu
  const handlePickColor = (color: string) => {
    if (!selectedText || !readingContentRef.current) return;
    const content = readingContentRef.current.innerText;
    const start = content.indexOf(selectedText);
    if (start === -1) return;
    const end = start + selectedText.length;
    setHighlightedRanges(ranges => [...ranges, {start, end, color}]);
    setShowColorPicker(false);
    setShowToolbar(false);
    setShowTranslatePopup(false);
    window.getSelection()?.removeAllRanges();
  };

  // Hàm render nội dung bài đọc với highlight
  const renderReadingContent = () => {
    if (!selectedPassage) return null;
    if (highlightedRanges.length === 0) return selectedPassage.content;
    let parts: React.ReactNode[] = [];
    let last = 0;
    const content = selectedPassage.content;
    const sorted = [...highlightedRanges].sort((a, b) => a.start - b.start);
    sorted.forEach(({start, end, color}, idx) => {
      if (last < start) parts.push(content.slice(last, start));
      parts.push(<mark key={idx} style={{background: color, color: '#222', padding: 0}}>{content.slice(start, end)}</mark>);
      last = end;
    });
    if (last < content.length) parts.push(content.slice(last));
    return parts;
  };

  // Khi showTranslatePopup chuyển từ false -> true, nếu chưa từng kéo thì đặt vị trí mặc định
  useEffect(() => {
    if (showTranslatePopup && !translatePopupPos && readingContentRef.current) {
      setTranslatePopupPos({
        x: toolbarPos.x - (readingContentRef.current.getBoundingClientRect().left || 0),
        y: (toolbarPos.y - (readingContentRef.current.getBoundingClientRect().top || 0)) + 36
      });
    }
    if (!showTranslatePopup) {
      setTranslatePopupPos(null);
    }
  }, [showTranslatePopup, toolbarPos, readingContentRef]);

  // Xử lý kéo popup dịch
  useEffect(() => {
    if (!draggingTranslate) return;
    const handleMouseMove = (e: MouseEvent) => {
      setTranslatePopupPos(pos => pos ? ({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      }) : pos);
    };
    const handleMouseUp = () => setDraggingTranslate(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTranslate, dragOffset]);

  if (loading) {
    return (
      <>
        {timerModal}
        <div className="flex justify-center items-center h-screen bg-gray-800">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
        </div>
      </>
    );
  }

  if (isTestActive && selectedPassage) {
    return (
      <>
        {timerModal}
        <div className={`min-h-screen bg-gray-800 ${isFullScreen ? 'p-0' : 'py-6 px-4'}`}>
          <div className="max-w-full mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-50">{selectedPassage.title}</h1>
                <div className="flex space-x-4 items-center">
                  {/* Font size adjustment controls */}
                  <div className="flex items-center space-x-3 px-3 py-1 bg-gray-600 rounded-lg">
                    <span className="text-sm text-gray-300">Cỡ chữ bài đọc:</span>
                    <button 
                      onClick={() => adjustFontSize('reading', false)} 
                      className="w-6 h-6 flex items-center justify-center text-gray-200 hover:text-primary-200"
                      disabled={readingFontSize <= 12}
                    >
                      <span className="text-xl font-bold">-</span>
                    </button>
                    <span className="text-sm text-gray-200">{readingFontSize}px</span>
                    <button 
                      onClick={() => adjustFontSize('reading', true)} 
                      className="w-6 h-6 flex items-center justify-center text-gray-200 hover:text-primary-200"
                      disabled={readingFontSize >= 24}
                    >
                      <span className="text-xl font-bold">+</span>
                    </button>
              </div>

                  <div className="flex items-center space-x-3 px-3 py-1 bg-gray-600 rounded-lg">
                    <span className="text-sm text-gray-300">Cỡ chữ câu hỏi:</span>
                    <button 
                      onClick={() => adjustFontSize('question', false)} 
                      className="w-6 h-6 flex items-center justify-center text-gray-200 hover:text-primary-200"
                      disabled={questionFontSize <= 12}
                    >
                      <span className="text-xl font-bold">-</span>
                    </button>
                    <span className="text-sm text-gray-200">{questionFontSize}px</span>
                <button
                      onClick={() => adjustFontSize('question', true)} 
                      className="w-6 h-6 flex items-center justify-center text-gray-200 hover:text-primary-200"
                      disabled={questionFontSize >= 24}
                    >
                      <span className="text-xl font-bold">+</span>
                </button>
                  </div>
                
                  <button
                    onClick={toggleFullScreen} 
                    className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
                    title={isFullScreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                  >
                    {isFullScreen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                    )}
                  </button>
                  {isTimerEnabled && timeLeft > 0 && (
                    <div className="text-right">
                      <div className="text-lg font-semibold text-red-400">
                        Thời gian: {formatTime(timeLeft)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main content: flex ngang, có splitter, hai panel cuộn độc lập */}
            <div ref={containerRef} className="flex-grow flex flex-row bg-gray-700 rounded-lg overflow-hidden" style={{height: 'calc(100vh - 120px)'}}>
              {/* Reading Passage */}
              <div 
                className="overflow-y-auto p-6 flex-1 min-w-0 invisible-scrollbar"
                style={{ width: `${readingPanelWidth}%`, maxWidth: `${readingPanelWidth}%` }}
              >
                <h2 className="text-xl font-bold text-gray-50 mb-4">Bài đọc</h2>
                <div className="bg-gray-600 rounded-lg p-4">
                  <div
                    ref={readingContentRef}
                    className="text-gray-200 leading-relaxed whitespace-pre-wrap select-text"
                    style={{ fontSize: `${readingFontSize}px`, position: 'relative' }}
                  >
                    {renderReadingContent()}
                    {/* Floating toolbar */}
                    {showToolbar && selectedText && (
                      <div
                        onMouseDown={e => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          left: toolbarPos.x - (readingContentRef.current?.getBoundingClientRect().left || 0),
                          top: toolbarPos.y - (readingContentRef.current?.getBoundingClientRect().top || 0),
                          zIndex: 1000,
                          background: '#222',
                          borderRadius: 8,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 20px',
                          gap: 16,
                          minWidth: 80,
                          minHeight: 44,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <button onClick={() => { handleTranslate(); setShowToolbar(false); }} title="Dịch" className="p-2 hover:bg-gray-700 rounded flex items-center justify-center" style={{minWidth: 36, minHeight: 36}}>
                          <TranslateIcon />
                        </button>
                        <button onClick={handleHighlight} title="Highlight" className="p-2 hover:bg-yellow-100 rounded flex items-center justify-center" style={{minWidth: 36, minHeight: 36}}>
                          <HighlightIcon />
                        </button>
                      </div>
                    )}
                    {/* Popup bản dịch */}
                    {showTranslatePopup && translatePopupPos && (
                      <div
                        data-translate-popup
                        onMouseDown={e => {
                          // Nếu bấm vào popup, bắt đầu drag
                          setDraggingTranslate(true);
                          setDragOffset({
                            x: e.clientX - translatePopupPos.x,
                            y: e.clientY - translatePopupPos.y
                          });
                          e.stopPropagation();
                        }}
                        onMouseUp={e => { setDraggingTranslate(false); e.stopPropagation(); }}
                        style={{
                          position: 'absolute',
                          left: translatePopupPos.x,
                          top: translatePopupPos.y,
                          zIndex: 1001,
                          background: '#fff',
                          color: '#222',
                          borderRadius: 8,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          padding: '8px 12px',
                          minWidth: 180,
                          maxWidth: 320,
                          cursor: draggingTranslate ? 'grabbing' : 'grab',
                          userSelect: 'none',
                        }}
                      >
                        <div className="text-lg">{translateResult}</div>
                      </div>
                    )}
                    {showColorPicker && (
                      <div
                        data-color-picker-popup
                        onMouseDown={e => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          left: colorPickerPos.x - (readingContentRef.current?.getBoundingClientRect().left || 0),
                          top: colorPickerPos.y - (readingContentRef.current?.getBoundingClientRect().top || 0),
                          zIndex: 1002,
                          background: '#fff',
                          borderRadius: 8,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          padding: '8px 12px',
                          display: 'flex',
                          gap: 8
                        }}
                      >
                        {HIGHLIGHT_COLORS.map((color, idx) => (
                          <button
                            key={color}
                            onClick={() => handlePickColor(color)}
                            title={`Highlight màu ${idx+1}`}
                            style={{
                              width: 28, height: 28, borderRadius: '50%', border: '2px solid #eee', background: color, cursor: 'pointer', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.07)'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Splitter */}
              <div
                ref={splitterRef}
                className="w-2 bg-gray-600 hover:bg-primary-500 cursor-col-resize active:bg-primary-400 transition-colors"
                style={{ zIndex: 10 }}
                onMouseDown={() => setIsDragging(true)}
              ></div>
              {/* Questions */}
              <div 
                className="overflow-y-auto p-6 flex-1 min-w-0 invisible-scrollbar"
                style={{ width: `${100 - readingPanelWidth}%`, maxWidth: `${100 - readingPanelWidth}%`, fontSize: `${questionFontSize}px` }}
              >
                <h2 className="text-xl font-bold text-gray-50 mb-6">Câu hỏi</h2>
                {questionGroups.map((group, groupIndex) => (
                  <div key={group.id} className="mb-8">
                    {/* Group Instructions */}
                    <div className="bg-gray-600 rounded-lg p-4 mb-4">
                      <div className="text-gray-200 whitespace-pre-wrap">
                        {group.instructions}
                      </div>
                    </div>
                    {/* Questions in this group */}
                    <div className="space-y-6">
                      {group.questions.map((question) => (
                        <div key={question.id} className="bg-gray-600 rounded-lg p-4">
                          <div className="mb-3">
                            <span className="text-lg font-semibold text-primary-200">Câu {question.order_index}</span>
                          </div>
                          <p className="text-gray-200 mb-4">{question.question_text}</p>
                          {/* Render options based on question type */}
                          {renderQuestionOptions(question, group.question_type)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Submit button */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={finishTest}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-lg"
                  >
                    Nộp bài
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (showResults) {
    return (
      <>
        {timerModal}
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
      </>
    );
  }

  return (
    <>
      {timerModal}
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
                  onClick={() => handleStartTestClick(passage)}
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
    </>
  );
};

IeltsReadingPage.getLayout = (page: React.ReactNode) => {
  return <Layout>{page}</Layout>;
};

export default IeltsReadingPage; 