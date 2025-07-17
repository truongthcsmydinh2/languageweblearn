import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
import Layout from '@/components/common/Layout';
import parse, { domToReact, HTMLReactParserOptions, Element, Text } from 'html-react-parser';

interface Passage {
  id: number;
  title: string;
  content: string;
  passage_data?: any; // Thêm trường passage_data
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  time_limit: number;
  question_count: number;
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'multiple_choice_5' | 'multiple_choice_group' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'diagram_labelling' | 'short_answer_questions';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  order_index: number;
  group_id?: string;
  guide?: string;
}

interface QuestionGroup {
  id: string;
  instructions: string;
  question_type: string;
  display_order: number;
  questions: Question[];
  options?: any; // Thêm trường options
  content?: any; // Thêm trường content cho summary_completion
  guide?: string;
  explanation?: string;
}

// Thêm icon SVG đơn giản cho dịch và highlight
const TranslateIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M3 5h18M9 3v2m6-2v2m-9 4h12M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 17l4-4m0 0l-4-4m4 4H8" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const HighlightIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 20h16M9 4h6l1 7H8l1-7zm2 7v5m2-5v5" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

// Thêm icon cho AI Translate và Cloud Translate
const AiTranslateIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloudTranslateIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
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

const TOOLBAR_HEIGHT = 48; // px
const TOOLBAR_WIDTH = 120; // px, ước lượng chiều rộng popup
const TOOLBAR_MARGIN = 8; // px

const IeltsReadingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string | string[]}>({});
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

  // State cho popup xóa highlight
  const [showRemoveHighlight, setShowRemoveHighlight] = useState(false);
  const [removeHighlightPos, setRemoveHighlightPos] = useState<{x: number, y: number} | null>(null);
  const [highlightToRemove, setHighlightToRemove] = useState<number | null>(null); // index trong mảng highlightedRanges
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null); // questionId hiện tại đang được highlight
  const [currentHighlightInfo, setCurrentHighlightInfo] = useState<{
    questionId: number;
    start: number;
    end: number;
    color: string;
  } | null>(null);

  // State cho note
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [notePopupPos, setNotePopupPos] = useState<{x: number, y: number} | null>(null);
  const [currentNote, setCurrentNote] = useState('');
  const [noteToEdit, setNoteToEdit] = useState<{questionId: number, index: number} | null>(null);
  const [highlightedRangesReadingWithNotes, setHighlightedRangesReadingWithNotes] = useState<{
    start: number;
    end: number;
    color: string;
    note?: string;
  }[]>([]);
  const [highlightedRangesQuestionWithNotes, setHighlightedRangesQuestionWithNotes] = useState<{
    [questionId: number]: {
      start: number;
      end: number;
      color: string;
      note?: string;
    }[]
  }>({});
  const [showNoteSavedMessage, setShowNoteSavedMessage] = useState(false);
  const [showNoteViewPopup, setShowNoteViewPopup] = useState(false);
  const [noteViewContent, setNoteViewContent] = useState('');
  const [noteViewPos, setNoteViewPos] = useState<{x: number, y: number} | null>(null);

  // State cho thông báo lưu từ
  const [saveTermStatus, setSaveTermStatus] = useState<'idle' | 'saving' | 'success' | 'error'>("idle");
  const [saveTermMsg, setSaveTermMsg] = useState<string>("");

  // State cho hiển thị chi tiết bài làm
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState<{[key: number]: boolean}>({});
  const [explanations, setExplanations] = useState<{[key: number]: string}>({});
  const [showAllExplanations, setShowAllExplanations] = useState(false);

  // State cho loại từ
  const [partOfSpeech, setPartOfSpeech] = useState<string>("");

  // State cho nghĩa tiếng Việt đã parse
  const [viMeaning, setViMeaning] = useState<string>("");

  // State cho loading AI Translate và Cloud Translate
  const [aiTranslateLoading, setAiTranslateLoading] = useState(false);
  const [cloudTranslateLoading, setCloudTranslateLoading] = useState(false);

  // Thêm ref cho panel câu hỏi
  const questionPanelRef = useRef<HTMLDivElement>(null);
  // State lưu panel hiện tại đang thao tác ("reading" | "question")
  const [currentPanel, setCurrentPanel] = useState<'reading' | 'question'>('reading');
  // State highlight cho cả hai panel
  const [highlightedRangesReading, setHighlightedRangesReading] = useState<{start: number, end: number, color: string}[]>([]);
  const [highlightedRangesQuestion, setHighlightedRangesQuestion] = useState<{[questionId: number]: {start: number, end: number, color: string}[]}>({});

  // Helper: key lưu localStorage theo id bài đọc
  const getLocalKey = (passageId: number | string | undefined) => passageId ? `ielts_reading_state_${passageId}` : '';

  // Khôi phục trạng thái khi vào lại trang hoặc khi chọn bài đọc
  useEffect(() => {
    if (selectedPassage?.id) {
      const saved = localStorage.getItem(getLocalKey(selectedPassage.id));
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.userAnswers) setUserAnswers(parsed.userAnswers);
          if (parsed.highlightedRangesReading) setHighlightedRangesReading(parsed.highlightedRangesReading);
          if (parsed.highlightedRangesQuestion) setHighlightedRangesQuestion(parsed.highlightedRangesQuestion);
        } catch {}
      }
    }
  }, [selectedPassage?.id]);

  // Tự động lưu mỗi khi userAnswers hoặc highlightedRanges thay đổi
  useEffect(() => {
    if (selectedPassage?.id) {
      const data = JSON.stringify({
        userAnswers,
        highlightedRangesReading,
        highlightedRangesQuestion
      });
      localStorage.setItem(getLocalKey(selectedPassage.id), data);
    }
  }, [userAnswers, highlightedRangesReading, highlightedRangesQuestion, selectedPassage?.id]);

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

  // --- GHI NHỚ CỠ CHỮ BÀI ĐỌC VÀ CÂU HỎI ---
  // Hàm set và lưu localStorage
  const setReadingFontSizeAndSave = (size: number) => {
    setReadingFontSize(size);
    localStorage.setItem('ielts_reading_fontsize_reading', String(size));
  };
  const setQuestionFontSizeAndSave = (size: number) => {
    setQuestionFontSize(size);
    localStorage.setItem('ielts_reading_fontsize_question', String(size));
  };
  // Khi vào trang, đọc lại giá trị đã lưu
  useEffect(() => {
    const savedReading = localStorage.getItem('ielts_reading_fontsize_reading');
    const savedQuestion = localStorage.getItem('ielts_reading_fontsize_question');
    const reading = Number(savedReading);
    const question = Number(savedQuestion);
    if (savedReading && !isNaN(reading)) setReadingFontSize(reading);
    if (savedQuestion && !isNaN(question)) setQuestionFontSize(question);
  }, []);
  // Sửa hàm adjustFontSize để dùng hàm mới
  const adjustFontSize = (type: 'reading' | 'question', increment: boolean) => {
    if (type === 'reading') {
      const newSize = Math.min(Math.max(increment ? readingFontSize + 1 : readingFontSize - 1, 12), 24);
      setReadingFontSizeAndSave(newSize);
    } else {
      const newSize = Math.min(Math.max(increment ? questionFontSize + 1 : questionFontSize - 1, 12), 24);
      setQuestionFontSizeAndSave(newSize);
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
        
        console.log('=== STARTING TEST ===');
        console.log('API response:', data);
        
        // Xử lý cấu trúc dữ liệu từ API
        if (data.groups && Array.isArray(data.groups)) {
          // API trả về cấu trúc mới với groups
          console.log('Using groups structure:', data.groups);
          setQuestionGroups(data.groups);
        } else if (data.questions && Array.isArray(data.questions)) {
          // API trả về cấu trúc cũ với questions array
          console.log('Using questions structure, creating groups');
          
          // Phân loại câu hỏi theo question_type để tạo nhóm
          const questionsByType: {[key: string]: Question[]} = {};
          
          data.questions.forEach((question: Question) => {
            const type = question.question_type;
            if (!questionsByType[type]) {
              questionsByType[type] = [];
            }
            questionsByType[type].push(question);
          });
          
          // Tạo groups từ questions đã phân loại
          const groups: QuestionGroup[] = Object.entries(questionsByType).map(([type, questions], index) => {
            const typeNames: {[key: string]: string} = {
              'true_false_not_given': 'True/False/Not Given',
              'yes_no_not_given': 'Yes/No/Not Given',
              'multiple_choice': 'Multiple Choice',
              'multiple_choice_5': 'Multiple Choice (5 options)',
              'multiple_choice_group': 'Multiple Choice Group',
              'sentence_completion': 'Sentence Completion',
              'summary_completion': 'Summary Completion',
              'note_completion': 'Note Completion',
              'table_completion': 'Table Completion',
              'flow_chart_completion': 'Flow Chart Completion',
              'diagram_labelling': 'Diagram Labelling',
              'short_answer_questions': 'Short Answer Questions'
            };
            
            return {
              id: `group-${index + 1}`,
              instructions: `Answer the following ${typeNames[type] || type} questions:`,
              question_type: type,
              display_order: index + 1,
              questions: questions,
              options: questions[0]?.options // Add options field
            };
          });
          
          console.log('Created groups from questions:', groups);
          setQuestionGroups(groups);
        } else {
          console.error('Invalid API response structure:', data);
          setQuestionGroups([]);
        }
        
        setSelectedPassage(passage);
        setUserAnswers({});
        setTimeLeft(enableTimer ? passage.time_limit * 60 : 0);
        setIsTestActive(true);
        setShowResults(false);
        
        console.log('=== END STARTING TEST ===');
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
      const userAnswer = userAnswers[question.id] ?? '';
      
      if (question.question_type === 'multiple_choice_5') {
        // Xử lý câu hỏi có 2 đáp án đúng
        const userAnswersArray = typeof userAnswer === 'string' ? userAnswer.split(',').map((a: string) => a.trim()).sort() : [];
        const correctAnswersArray = question.correct_answer ? question.correct_answer.split(',').map((a: string) => a.trim()).sort() : [];
        
        // So sánh mảng đáp án
        if (userAnswersArray.length === correctAnswersArray.length) {
          const isCorrect = userAnswersArray.every((answer: string, index: number) => answer === correctAnswersArray[index]);
          return count + (isCorrect ? 1 : 0);
        }
        return count;
      } else if (question.question_type === 'multiple_choice_group') {
        // Xử lý câu hỏi nhóm (1 đáp án đúng)
        return count + (userAnswer === question.correct_answer ? 1 : 0);
      } else {
        // Xử lý câu hỏi thường
        return count + (userAnswer === question.correct_answer ? 1 : 0);
      }
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

    if (selectedPassage?.id) {
      localStorage.removeItem(getLocalKey(selectedPassage.id));
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
    
    // Tìm group chứa câu hỏi này để lấy options
    const currentGroup = questionGroups.find(group => 
      group.questions.some(q => q.id === question.id)
    );
    
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
      case 'multiple_choice_5':
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
              <span>{userAnswer || (groupType === 'multiple_choice_5' ? "Chọn 2 đáp án..." : "Chọn câu trả lời...")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {openDropdowns[question.id] && (
              <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-500 rounded-lg shadow-lg max-h-60 overflow-auto">
                {groupType === 'multiple_choice_5' ? (
                  // Hiển thị checkbox cho multiple_choice_5
                  <div className="p-2">
                    {question.options && question.options.map((option, index) => (
                      <label key={index} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-600 rounded">
                        <input
                          type="checkbox"
                          checked={typeof userAnswer === 'string' ? userAnswer.split(',').map((a: string) => a.trim()).includes(option) : Array.isArray(userAnswer) ? userAnswer.includes(option) : false}
                          onChange={(e) => {
                            const currentAnswers: string[] = typeof userAnswer === 'string' ? userAnswer.split(',').map((a: string) => a.trim()) : Array.isArray(userAnswer) ? userAnswer as string[] : [];
                            if (e.target.checked) {
                              // Thêm đáp án mới (tối đa 2)
                              if (currentAnswers.length < 2) {
                                const newAnswers = [...currentAnswers, option];
                                handleAnswer(question.id, newAnswers.join(','));
                              }
                            } else {
                              // Xóa đáp án
                              const newAnswers = currentAnswers.filter((a: string) => a !== option);
                              handleAnswer(question.id, newAnswers.join(','));
                            }
                          }}
                          className="text-primary-200 focus:ring-primary-200"
                        />
                        <span className="text-gray-200">{option}</span>
                      </label>
                    ))}
                    <div className="text-xs text-gray-400 p-2 border-t border-gray-600">
                      Chọn tối đa 2 đáp án
                    </div>
                  </div>
                ) : (
                  // Hiển thị radio cho multiple_choice thường
                  question.options && question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(question.id, option)}
                      className={`block w-full text-left px-4 py-3 hover:bg-gray-600 ${userAnswer === option ? 'bg-gray-600' : ''}`}
                    >
                      <span className="text-gray-200">{option}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        );

      case 'multiple_choice_group':
        // Nếu không phải dạng đặc biệt, fallback về radio như cũ
        // ... existing code ...
      
      case 'matching_information':
      case 'matching_headings':
      case 'matching_features':
      case 'matching_sentence_endings':
        // Chỉ render dropdown chọn đáp án, không render lại số thứ tự, box, nội dung
        return (
          <select
            className="w-full p-3 bg-gray-800 border border-gray-500 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-lg"
            value={userAnswer}
            onChange={e => handleAnswer(question.id, e.target.value)}
          >
            <option value="">Chọn đáp án...</option>
            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
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
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    } else {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isDragging]);

  // Lắng nghe selection trong panel bài đọc
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setShowToolbar(false);
        setShowTranslatePopup(false);
        return;
      }
      
      const selectedText = selection.toString().trim();
      if (!selectedText) {
        setShowToolbar(false);
        setShowTranslatePopup(false);
        return;
      }
      
      const range = selection.getRangeAt(0);
      // Nếu selection nằm trong popup dịch hoặc popup màu thì không hiện toolbar
      const translatePopup = document.querySelector('[data-translate-popup]');
      const colorPickerPopup = document.querySelector('[data-color-picker-popup]');
      if ((translatePopup && translatePopup.contains(range.commonAncestorContainer)) ||
          (colorPickerPopup && colorPickerPopup.contains(range.commonAncestorContainer))) {
        setShowToolbar(false);
        setShowTranslatePopup(false);
        return;
      }
      
      // Cho phép highlight ở cả hai panel
      const isInReadingPanel = readingContentRef.current && readingContentRef.current.contains(range.commonAncestorContainer);
      const isInQuestionPanel = questionPanelRef.current && questionPanelRef.current.contains(range.commonAncestorContainer);
      
      if (isInReadingPanel) {
        setCurrentPanel('reading');
      } else if (isInQuestionPanel) {
        setCurrentPanel('question');
      } else {
        // Nếu không nằm trong panel nào thì không hiện toolbar
        setShowToolbar(false);
        setShowTranslatePopup(false);
        return;
      }
      
      const rect = range.getBoundingClientRect();
      // Tính toán vị trí popup: ưu tiên phía trên, nếu không đủ thì phía dưới, và lệch sang phải
      let x = rect.right + window.scrollX + TOOLBAR_MARGIN; // lệch sang phải vùng bôi đen
      let y = rect.top + window.scrollY - TOOLBAR_HEIGHT - TOOLBAR_MARGIN;
      // Nếu phía trên không đủ chỗ, hiện phía dưới
      if (y < window.scrollY) {
        y = rect.bottom + window.scrollY + TOOLBAR_MARGIN;
      }
      // Nếu lệch phải vượt màn hình, dịch sang trái
      if (x + TOOLBAR_WIDTH > window.scrollX + window.innerWidth) {
        x = rect.left + window.scrollX - TOOLBAR_WIDTH - TOOLBAR_MARGIN;
        if (x < window.scrollX) x = window.scrollX + TOOLBAR_MARGIN; // sát mép trái
      }
      // Nếu popup vượt mép trên, căn sát mép trên
      if (y < window.scrollY) y = window.scrollY + TOOLBAR_MARGIN;
      // Nếu popup vượt mép dưới, căn sát mép dưới
      if (y + TOOLBAR_HEIGHT > window.scrollY + window.innerHeight) y = window.scrollY + window.innerHeight - TOOLBAR_HEIGHT - TOOLBAR_MARGIN;
      setToolbarPos({ x, y });
      setSelectedText(selectedText);
      setShowToolbar(true);
      setShowTranslatePopup(false);
    };
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    // Ẩn toolbar khi click ra ngoài
    const handleClick = (e: MouseEvent) => {
      // Nếu click vào popup dịch thì không ẩn
      const translatePopup = document.querySelector('[data-translate-popup]');
      if (translatePopup && translatePopup.contains(e.target as Node)) return;
      // Nếu click vào popup xóa highlight thì không ẩn
      const removeHighlightPopup = document.querySelector('[data-remove-highlight-popup]');
      if (removeHighlightPopup && removeHighlightPopup.contains(e.target as Node)) return;
      // Nếu popup xóa highlight đang mở, click ngoài popup sẽ ẩn popup
      if (showRemoveHighlight) {
        setShowRemoveHighlight(false);
        return;
      }
      // Nếu click ngoài cả hai panel thì ẩn các popup khác
      const isInReadingPanel = readingContentRef.current && readingContentRef.current.contains(e.target as Node);
      const isInQuestionPanel = questionPanelRef.current && questionPanelRef.current.contains(e.target as Node);
      if (!isInReadingPanel && !isInQuestionPanel) {
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

  // Hàm highlight nhanh với màu đã chọn
 

  // Thêm keyboard shortcuts cho highlight nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chỉ xử lý khi có text được chọn và đang trong test mode
      if (!isTestActive || !selectedText || !selectedText.trim()) return;
      
      // Kiểm tra xem có đang focus vào input/textarea không
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      
      let color: string | null = null;
      
      // Ctrl + B: highlight màu vàng
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        color = '#fef08a'; // vàng nhạt
      }
      // Ctrl + N: highlight màu xanh lá cây
      else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        color = '#a7f3d0'; // xanh mint
      }
      // Ctrl + M: highlight màu cam
      else if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        color = '#fdba74'; // cam nhạt
      }
      
      if (color) {
        // Gọi hàm highlight với màu đã chọn
        handleQuickHighlight(color);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTestActive, selectedText]);

  // Gửi API Gemini để dịch
  const handleTranslate = async () => {
    if (!selectedText) return;
    
    try {
      const response = await fetch('/api/admin/translate-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ englishText: selectedText })
      });
      
      if (!response.ok) {
        throw new Error('Lỗi khi dịch');
      }
      
      const data = await response.json();
      setViMeaning(data.translatedText || 'Không thể dịch');
      setPartOfSpeech(data.partOfSpeech || '');
      setShowTranslatePopup(true);
      setTranslatePopupPos({ x: toolbarPos.x, y: toolbarPos.y + TOOLBAR_HEIGHT + TOOLBAR_MARGIN });
    } catch (error) {
      console.error('Lỗi dịch:', error);
      setViMeaning('Lỗi khi dịch');
      setShowTranslatePopup(true);
      setTranslatePopupPos({ x: toolbarPos.x, y: toolbarPos.y + TOOLBAR_HEIGHT + TOOLBAR_MARGIN });
    }
  };

  // Hàm dịch bằng AI (Gemini API)
  const handleAiTranslate = async () => {
    if (!selectedText) return;
    setAiTranslateLoading(true);
    try {
      const response = await fetch('/api/admin/translate-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ englishText: selectedText })
      });
      let vi = '';
      let pos = '';
      if (!response.ok) {
        vi = 'Lỗi khi dịch AI';
        pos = '';
      } else {
        const data = await response.json();
        vi = data.translatedText || 'Không thể dịch';
        pos = data.partOfSpeech || '';
      }
      setViMeaning(vi);
      setPartOfSpeech(pos);
      setShowTranslatePopup(true);
      setTranslatePopupPos({ x: toolbarPos.x, y: toolbarPos.y + TOOLBAR_HEIGHT + TOOLBAR_MARGIN });
    } catch (error) {
      setViMeaning('Lỗi khi dịch AI');
      setPartOfSpeech('');
      setShowTranslatePopup(true);
      setTranslatePopupPos({ x: toolbarPos.x, y: toolbarPos.y + TOOLBAR_HEIGHT + TOOLBAR_MARGIN });
    } finally {
      setAiTranslateLoading(false);
      // Không đóng toolbar ngay để user thấy popup
    }
  };

  // Hàm dịch bằng Cloud Translation API
  const handleCloudTranslate = async () => {
    if (!selectedText) return;
    setCloudTranslateLoading(true);
    try {
      const response = await fetch('/api/admin/translate-cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ englishText: selectedText })
      });
      let vi = '';
      let pos = '';
      if (!response.ok) {
        vi = 'Lỗi khi dịch nhanh';
        pos = '';
      } else {
        const data = await response.json();
        vi = data.translatedText || 'Không thể dịch';
        pos = data.partOfSpeech || '';
      }
      setViMeaning(vi);
      setPartOfSpeech(pos);
      setShowTranslatePopup(true);
      setTranslatePopupPos({ x: toolbarPos.x, y: toolbarPos.y + TOOLBAR_HEIGHT + TOOLBAR_MARGIN });
    } catch (error) {
      setViMeaning('Lỗi khi dịch nhanh');
      setPartOfSpeech('');
      setShowTranslatePopup(true);
      setTranslatePopupPos({ x: toolbarPos.x, y: toolbarPos.y + TOOLBAR_HEIGHT + TOOLBAR_MARGIN });
    } finally {
      setCloudTranslateLoading(false);
      // Không đóng toolbar ngay để user thấy popup
    }
  };

  // Highlight đoạn text đã chọn
  const handleHighlight = () => {
    if (!selectedText || !selectedText.trim()) return;
    
    const ref = currentPanel === 'reading' ? readingContentRef : questionPanelRef;
    if (!ref.current) return;
    
    setColorPickerPos({
      x: toolbarPos.x,
      y: toolbarPos.y + 36
    });
    setShowColorPicker(true);
    setShowToolbar(false);
    setShowTranslatePopup(false);
  };

  // Hàm highlight nhanh với màu đã chọn
  const handleQuickHighlight = (color: string) => {
    if (!selectedText || !selectedText.trim()) return;
    
    const ref = currentPanel === 'reading' ? readingContentRef : questionPanelRef;
    if (!ref.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    
    if (currentPanel === 'reading') {
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(ref.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const start = preSelectionRange.toString().length;
      const end = start + range.toString().length;
      
      if (start === end) return;
      
      setHighlightedRangesReading(ranges => {
        let newRanges = [] as {start: number, end: number, color: string}[];
        for (const r of ranges) {
          if (end <= r.start || start >= r.end) {
            newRanges.push(r);
          } else {
            if (r.start < start) newRanges.push({ start: r.start, end: start, color: r.color });
            if (r.end > end) newRanges.push({ start: end, end: r.end, color: r.color });
          }
        }
        newRanges.push({ start, end, color });
        newRanges.sort((a, b) => a.start - b.start);
        return newRanges;
      });
      // Đồng bộ với note state
      setHighlightedRangesReadingWithNotes(ranges => {
        let newRanges = [] as {start: number, end: number, color: string, note?: string}[];
        for (const r of ranges) {
          if (end <= r.start || start >= r.end) {
            newRanges.push(r);
          } else {
            if (r.start < start) newRanges.push({ start: r.start, end: start, color: r.color, note: r.note });
            if (r.end > end) newRanges.push({ start: end, end: r.end, color: r.color, note: r.note });
          }
        }
        newRanges.push({ start, end, color });
        newRanges.sort((a, b) => a.start - b.start);
        return newRanges;
      });
    } else {
      // Panel câu hỏi: sử dụng logic tương tự như handlePickColor
      const selectedTextContent = selection.toString();
      
      // Tìm questionId bằng cách kiểm tra xem range có nằm trong element nào
      let questionId: number | null = null;
      let questionElement: HTMLElement | null = null;
      
      // Tìm element cha chứa câu hỏi
      let currentElement: Node | null = range.commonAncestorContainer;
      while (currentElement && currentElement !== ref.current) {
        if (currentElement.nodeType === Node.ELEMENT_NODE) {
          const element = currentElement as HTMLElement;
          // Kiểm tra xem element có chứa data-question-id không
          if (element.hasAttribute('data-question-id')) {
            questionId = parseInt(element.getAttribute('data-question-id') || '0');
            questionElement = element;
            break;
          }
        }
        currentElement = currentElement.parentNode;
      }
      
      // Fallback: nếu không tìm thấy data-question-id, tìm bằng text content
      if (!questionId) {
        for (const group of questionGroups) {
          for (const question of group.questions) {
            if (question.question_text && question.question_text.includes(selectedTextContent)) {
              questionId = question.id;
              // Tìm element chứa text này
              const elements = ref.current?.querySelectorAll('[data-question-id]');
              if (elements) {
                for (const el of elements) {
                  if (el.getAttribute('data-question-id') === questionId.toString()) {
                    questionElement = el as HTMLElement;
                    break;
                  }
                }
              }
              break;
            }
          }
          if (questionId) break;
        }
      }
      
      if (!questionId || !questionElement) return;
      
      // Lưu questionId hiện tại
      setCurrentQuestionId(questionId);
      
      console.log('=== HIGHLIGHTING QUESTION TEXT ===');
      console.log('selectedTextContent:', selectedTextContent);
      console.log('questionId:', questionId);
      console.log('questionElement:', questionElement);
      
      // Tính toán vị trí trong text của câu hỏi
      const questionText = questionGroups.flatMap(g => g.questions).find(q => q.id === questionId)?.question_text || '';
      
      console.log('questionText:', questionText);
      console.log('=== END HIGHLIGHTING QUESTION TEXT ===');
      
      // Tìm element chứa text của câu hỏi (không phải element cha)
      let textElement: HTMLElement | null = null;
      
      // Cách 1: Tìm element có class text-gray-200 chứa text được chọn
      const textElements = questionElement.querySelectorAll('.text-gray-200');
      for (const el of textElements) {
        if (el.textContent?.includes(selectedTextContent)) {
          textElement = el as HTMLElement;
          break;
        }
      }
      
      // Cách 2: Nếu không tìm thấy, tìm element chứa text node được chọn
      if (!textElement) {
        const walker = document.createTreeWalker(
          questionElement,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let textNode: Node | null;
        while (textNode = walker.nextNode()) {
          if (textNode.textContent?.includes(selectedTextContent)) {
            // Tìm element cha chứa text node này
            let parent = textNode.parentElement;
            while (parent && parent !== questionElement) {
              if (parent.textContent === questionText || parent.textContent?.includes(selectedTextContent)) {
                textElement = parent;
                break;
              }
              parent = parent.parentElement;
            }
            if (textElement) break;
          }
        }
      }
      
      // Cách 3: Nếu không tìm thấy, sử dụng element cha
      if (!textElement) {
        textElement = questionElement;
      }
      
      // Sử dụng Range API để tính toán chính xác vị trí
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(textElement);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const start = preSelectionRange.toString().length;
      const end = start + range.toString().length;
      
      // Fallback: nếu Range API không chính xác, sử dụng string matching
      let finalStart = start;
      let finalEnd = end;
      
      if (start === end || start < 0 || end > questionText.length) {
        const stringStart = questionText.indexOf(selectedTextContent);
        if (stringStart !== -1) {
          finalStart = stringStart;
          finalEnd = stringStart + selectedTextContent.length;
        } else {
          
          return;
        }
      }
      
      if (finalStart === -1 || finalStart === finalEnd) {
        
        return;
      }
      
      // Validation: đảm bảo vị trí không vượt quá độ dài text
      if (finalStart >= questionText.length || finalEnd > questionText.length) {
        
        return;
      }
      
      // Lưu thông tin highlight hiện tại
      setCurrentHighlightInfo({
        questionId: questionId,
        start: finalStart,
        end: finalEnd,
        color: color
      });
      
      setHighlightedRangesQuestion(ranges => {
        const prev = ranges[questionId!] || [];
        let newRanges = [] as {start: number, end: number, color: string}[];
        for (const r of prev) {
          if (finalEnd <= r.start || finalStart >= r.end) {
            newRanges.push(r);
          } else {
            if (r.start < finalStart) newRanges.push({ start: r.start, end: finalStart, color: r.color });
            if (r.end > finalEnd) newRanges.push({ start: finalEnd, end: r.end, color: r.color });
          }
        }
        newRanges.push({ start: finalStart, end: finalEnd, color });
        newRanges.sort((a, b) => a.start - b.start);
        return { ...ranges, [questionId!]: newRanges };
      });
      // Đồng bộ với note state
      setHighlightedRangesQuestionWithNotes(ranges => {
        const prev = ranges[questionId!] || [];
        let newRanges = [] as {start: number, end: number, color: string, note?: string}[];
        for (const r of prev) {
          if (finalEnd <= r.start || finalStart >= r.end) {
            newRanges.push(r);
          } else {
            if (r.start < finalStart) newRanges.push({ start: r.start, end: finalStart, color: r.color, note: r.note });
            if (r.end > finalEnd) newRanges.push({ start: finalEnd, end: r.end, color: r.color, note: r.note });
          }
        }
        newRanges.push({ start: finalStart, end: finalEnd, color });
        newRanges.sort((a, b) => a.start - b.start);
        return { ...ranges, [questionId!]: newRanges };
      });
    }
    
    // Ẩn toolbar và xóa selection
    setShowToolbar(false);
    setShowTranslatePopup(false);
    setShowColorPicker(false);
    setSelectedText('');
    setCurrentHighlightInfo(null);
    window.getSelection()?.removeAllRanges();
  };

  // Highlight cho cả hai panel
  const handlePickColor = (color: string) => {
    if (!selectedText) return;
    
    const ref = currentPanel === 'reading' ? readingContentRef : questionPanelRef;
    if (!ref.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    
    if (currentPanel === 'reading') {
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(ref.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const start = preSelectionRange.toString().length;
      const end = start + range.toString().length;
      
      if (start === end) return;
      
      setHighlightedRangesReading(ranges => {
        let newRanges = [] as {start: number, end: number, color: string}[];
        for (const r of ranges) {
          if (end <= r.start || start >= r.end) {
            newRanges.push(r);
          } else {
            if (r.start < start) newRanges.push({ start: r.start, end: start, color: r.color });
            if (r.end > end) newRanges.push({ start: end, end: r.end, color: r.color });
          }
        }
        newRanges.push({ start, end, color });
        newRanges.sort((a, b) => a.start - b.start);
        return newRanges;
      });
      // Đồng bộ với note state
      setHighlightedRangesReadingWithNotes(ranges => {
        let newRanges = [] as {start: number, end: number, color: string, note?: string}[];
        for (const r of ranges) {
          if (end <= r.start || start >= r.end) {
            newRanges.push(r);
          } else {
            if (r.start < start) newRanges.push({ start: r.start, end: start, color: r.color, note: r.note });
            if (r.end > end) newRanges.push({ start: end, end: r.end, color: r.color, note: r.note });
          }
        }
        newRanges.push({ start, end, color });
        newRanges.sort((a, b) => a.start - b.start);
        return newRanges;
      });
    } else {
      // Panel câu hỏi: sử dụng Range API để tính toán chính xác vị trí
      const selectedTextContent = selection.toString();
      
      // Tìm questionId bằng cách kiểm tra xem range có nằm trong element nào
      let questionId: number | null = null;
      let questionElement: HTMLElement | null = null;
      
      // Tìm element cha chứa câu hỏi
      let currentElement: Node | null = range.commonAncestorContainer;
      while (currentElement && currentElement !== ref.current) {
        if (currentElement.nodeType === Node.ELEMENT_NODE) {
          const element = currentElement as HTMLElement;
          // Kiểm tra xem element có chứa data-question-id không
          if (element.hasAttribute('data-question-id')) {
            questionId = parseInt(element.getAttribute('data-question-id') || '0');
            questionElement = element;
            break;
          }
        }
        currentElement = currentElement.parentNode;
      }
      
      // Fallback: nếu không tìm thấy data-question-id, tìm bằng text content
      if (!questionId) {
        for (const group of questionGroups) {
          for (const question of group.questions) {
            if (question.question_text && question.question_text.includes(selectedTextContent)) {
              questionId = question.id;
              // Tìm element chứa text này
              const elements = ref.current?.querySelectorAll('[data-question-id]');
              if (elements) {
                for (const el of elements) {
                  if (el.getAttribute('data-question-id') === questionId.toString()) {
                    questionElement = el as HTMLElement;
                    break;
                  }
                }
              }
              break;
            }
          }
          if (questionId) break;
        }
      }
      
      if (!questionId || !questionElement) return;
      
      // Lưu questionId hiện tại
      setCurrentQuestionId(questionId);
      
      // Tính toán vị trí trong text của câu hỏi sử dụng Range API
      const questionText = questionGroups.flatMap(g => g.questions).find(q => q.id === questionId)?.question_text || '';
      
      // Tìm element chứa text của câu hỏi (không phải element cha)
      let textElement: HTMLElement | null = null;
      
      // Cách 1: Tìm element có class text-gray-200 chứa text được chọn
      const textElements = questionElement.querySelectorAll('.text-gray-200');
      for (const el of textElements) {
        if (el.textContent?.includes(selectedTextContent)) {
          textElement = el as HTMLElement;
          break;
        }
      }
      
      // Cách 2: Nếu không tìm thấy, tìm element chứa text node được chọn
      if (!textElement) {
        const walker = document.createTreeWalker(
          questionElement,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let textNode: Node | null;
        while (textNode = walker.nextNode()) {
          if (textNode.textContent?.includes(selectedTextContent)) {
            // Tìm element cha chứa text node này
            let parent = textNode.parentElement;
            while (parent && parent !== questionElement) {
              if (parent.textContent === questionText || parent.textContent?.includes(selectedTextContent)) {
                textElement = parent;
                break;
              }
              parent = parent.parentElement;
            }
            if (textElement) break;
          }
        }
      }
      
      // Cách 3: Nếu không tìm thấy, sử dụng element cha
      if (!textElement) {
        textElement = questionElement;
      }
      
      // Tính toán vị trí trong text của câu hỏi
      // Sử dụng Range API để tính toán chính xác vị trí
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(textElement);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const start = preSelectionRange.toString().length;
      const end = start + range.toString().length;
      
      // Fallback: nếu Range API không chính xác, sử dụng string matching
      let finalStart = start;
      let finalEnd = end;
      
      if (start === end || start < 0 || end > questionText.length) {
        const stringStart = questionText.indexOf(selectedTextContent);
        if (stringStart !== -1) {
          finalStart = stringStart;
          finalEnd = stringStart + selectedTextContent.length;
        } else {
          
          return;
        }
      }
      

      
      if (finalStart === -1 || finalStart === finalEnd) {
        
        return;
      }
      
      // Validation: đảm bảo vị trí không vượt quá độ dài text
      if (finalStart >= questionText.length || finalEnd > questionText.length) {
        
        return;
      }
      
      // Lưu thông tin highlight hiện tại
      setCurrentHighlightInfo({
        questionId: questionId,
        start: finalStart,
        end: finalEnd,
        color: color
      });
      
      setHighlightedRangesQuestion(ranges => {
        const prev = ranges[questionId!] || [];
        let newRanges = [] as {start: number, end: number, color: string}[];
        for (const r of prev) {
          if (finalEnd <= r.start || finalStart >= r.end) {
            newRanges.push(r);
          } else {
            if (r.start < finalStart) newRanges.push({ start: r.start, end: finalStart, color: r.color });
            if (r.end > finalEnd) newRanges.push({ start: finalEnd, end: r.end, color: r.color });
          }
        }
        newRanges.push({ start: finalStart, end: finalEnd, color });
        newRanges.sort((a, b) => a.start - b.start);
        return { ...ranges, [questionId!]: newRanges };
      });
      
      // Đồng bộ với note state cho question panel
      setHighlightedRangesQuestionWithNotes(ranges => {
        const prev = ranges[questionId!] || [];
        let newRanges = [] as {start: number, end: number, color: string, note?: string}[];
        for (const r of prev) {
          if (finalEnd <= r.start || finalStart >= r.end) {
            newRanges.push(r);
          } else {
            if (r.start < finalStart) newRanges.push({ start: r.start, end: finalStart, color: r.color, note: r.note });
            if (r.end > finalEnd) newRanges.push({ start: finalEnd, end: r.end, color: r.color, note: r.note });
          }
        }
        newRanges.push({ start: finalStart, end: finalEnd, color });
        newRanges.sort((a, b) => a.start - b.start);
        return { ...ranges, [questionId!]: newRanges };
      });
    }
    
    setShowColorPicker(false);
    setShowToolbar(false);
    setShowTranslatePopup(false);
    setSelectedText('');
    setCurrentHighlightInfo(null);
    window.getSelection()?.removeAllRanges();
  };

  // Hàm xóa highlight cho cả hai panel
  const handleRemoveHighlight = () => {
    console.log('=== REMOVING HIGHLIGHT ===');
    console.log('highlightToRemove:', highlightToRemove);
    console.log('currentPanel:', currentPanel);
    console.log('currentQuestionId:', currentQuestionId);
    
    if (highlightToRemove === null) return;
    
    if (currentPanel === 'reading') {
      setHighlightedRangesReading(ranges => ranges.filter((_, idx) => idx !== highlightToRemove));
      // Đồng bộ với note state
      setHighlightedRangesReadingWithNotes(ranges => ranges.filter((_, idx) => idx !== highlightToRemove));
    } else {
      // Sử dụng currentQuestionId đã được lưu
      const questionId = currentQuestionId;
      
      if (questionId === null) return;
      setHighlightedRangesQuestion(ranges => ({
        ...ranges,
        [questionId]: ranges[questionId] ? ranges[questionId].filter((_, idx) => idx !== highlightToRemove) : []
      }));
      setHighlightedRangesQuestionWithNotes(ranges => ({
        ...ranges,
        [questionId]: ranges[questionId] ? ranges[questionId].filter((_, idx) => idx !== highlightToRemove) : []
      }));
    }
    setShowRemoveHighlight(false);
    setHighlightToRemove(null);
    setCurrentQuestionId(null);
  };

  // Hàm mở popup note
  const handleOpenNote = (e: React.MouseEvent, questionId?: number, index?: number) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setNotePopupPos({
      x: rect.right + window.scrollX + 8,
      y: rect.top + window.scrollY
    });
    
    if (questionId !== undefined && index !== undefined) {
      // Note cho question panel
      setNoteToEdit({ questionId, index });
      const questionRangesWithNotes = highlightedRangesQuestionWithNotes[questionId] || [];
      const note = questionRangesWithNotes[index]?.note || '';
      
      console.log('=== OPENING QUESTION NOTE POPUP ===');
      console.log('questionId:', questionId);
      console.log('index:', index);
      console.log('questionRangesWithNotes:', questionRangesWithNotes);
      console.log('note:', note);
      console.log('=== END OPENING QUESTION NOTE POPUP ===');
      
      setCurrentNote(note);
    } else {
      // Note cho reading panel
      setNoteToEdit(null);
      const note = highlightedRangesReadingWithNotes[index!]?.note || '';
      
      console.log('=== OPENING READING NOTE POPUP ===');
      console.log('index:', index);
      console.log('readingRangesWithNotes:', highlightedRangesReadingWithNotes);
      console.log('note:', note);
      console.log('=== END OPENING READING NOTE POPUP ===');
      
      setCurrentNote(note);
    }
    
    setShowNotePopup(true);
  };

  // Hàm xem note (chỉ đọc, không chỉnh sửa)
  const handleViewNote = (e: React.MouseEvent, questionId?: number, index?: number) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setNoteViewPos({
      x: rect.right + window.scrollX + 8,
      y: rect.top + window.scrollY
    });
    
    console.log('=== VIEWING NOTE ===');
    console.log('questionId:', questionId);
    console.log('index:', index);
    
    let noteContent = '';
    if (questionId !== undefined && index !== undefined) {
      // Note cho question panel
      const questionRangesWithNotes = highlightedRangesQuestionWithNotes[questionId] || [];
      noteContent = questionRangesWithNotes[index]?.note || '';
      console.log('questionRangesWithNotes:', questionRangesWithNotes);
    } else {
      // Note cho reading panel
      noteContent = highlightedRangesReadingWithNotes[index!]?.note || '';
      console.log('readingRangesWithNotes:', highlightedRangesReadingWithNotes);
    }
    
    console.log('noteContent:', noteContent);
    console.log('=== END VIEWING NOTE ===');
    
    setNoteViewContent(noteContent);
    setShowNoteViewPopup(true);
  };

  // Hàm lưu note
  const handleSaveNote = () => {

    
    if (noteToEdit) {
      // Lưu note cho question panel
      setHighlightedRangesQuestionWithNotes(ranges => {
        const currentQuestionRanges = highlightedRangesQuestion[noteToEdit.questionId] || [];
        const prev = ranges[noteToEdit.questionId] || [];
        
        // Đảm bảo prev có cùng số lượng với currentQuestionRanges
        const normalizedPrev = currentQuestionRanges.map((range, idx) => ({
          ...range,
          note: prev[idx]?.note || undefined
        }));
        
        // Tạo mảng mới với note được cập nhật
        const newRanges = normalizedPrev.map((range, idx) => {
          if (idx === noteToEdit.index) {
            return {
              ...range,
              note: currentNote.trim() || undefined
            };
          } else {
            return range;
          }
        });
        
        console.log('=== SAVING QUESTION NOTE ===');
        console.log('noteToEdit:', noteToEdit);
        console.log('currentNote:', currentNote);
        console.log('prev ranges:', prev);
        console.log('normalizedPrev:', normalizedPrev);
        console.log('currentQuestionRanges:', currentQuestionRanges);
        console.log('newRanges:', newRanges);
        
        const updatedRanges = { ...ranges, [noteToEdit.questionId]: newRanges };
        console.log('Final updated ranges:', updatedRanges);
        console.log('=== END SAVING QUESTION NOTE ===');
        
        return updatedRanges;
      });
    } else {
      // Lưu note cho reading panel - đảm bảo đồng bộ với highlightedRangesReading
      setHighlightedRangesReadingWithNotes(ranges => {
        // Lấy highlightedRangesReading hiện tại để đồng bộ
        const currentRanges = highlightedRangesReading;
        const newRanges = currentRanges.map((range, idx) => ({
          ...range,
          note: idx === highlightToRemove ? (currentNote.trim() || undefined) : (ranges[idx]?.note || undefined)
        }));
        
        console.log('=== SAVING READING NOTE ===');
        console.log('highlightToRemove:', highlightToRemove);
        console.log('currentNote:', currentNote);
        console.log('currentRanges:', currentRanges);
        console.log('newRanges:', newRanges);
        console.log('=== END SAVING READING NOTE ===');
        
        return newRanges;
      });
    }
    
    // Hiển thị thông báo lưu thành công
    setShowNoteSavedMessage(true);
    setTimeout(() => {
      setShowNoteSavedMessage(false);
      setShowNotePopup(false);
      setCurrentNote('');
      setNoteToEdit(null);
    }, 1500);
  };

  // Hàm xóa note
  const handleDeleteNote = () => {
    console.log('=== DELETING NOTE ===');
    console.log('noteToEdit:', noteToEdit);
    console.log('highlightToRemove:', highlightToRemove);
    
    if (noteToEdit) {
      // Xóa note cho question panel
      setHighlightedRangesQuestionWithNotes(ranges => {
        const currentQuestionRanges = highlightedRangesQuestion[noteToEdit.questionId] || [];
        const prev = ranges[noteToEdit.questionId] || [];
        
        // Đảm bảo prev có cùng số lượng với currentQuestionRanges
        const normalizedPrev = currentQuestionRanges.map((range, idx) => ({
          ...range,
          note: prev[idx]?.note || undefined
        }));
        
        const newRanges = normalizedPrev.map((range, idx) => ({
          ...range,
          note: idx === noteToEdit.index ? undefined : range.note
        }));
        
        return { ...ranges, [noteToEdit.questionId]: newRanges };
      });
    } else {
      // Xóa note cho reading panel
      setHighlightedRangesReadingWithNotes(ranges => {
        const newRanges = [...ranges];
        if (newRanges[highlightToRemove!]) {
          newRanges[highlightToRemove!] = {
            ...newRanges[highlightToRemove!],
            note: undefined
          };
        }
        return newRanges;
      });
    }
    
    setShowNotePopup(false);
    setCurrentNote('');
    setNoteToEdit(null);
  };

  // Hàm render nội dung bài đọc với highlight
  const renderReadingContent = () => {
    if (!selectedPassage) return null;
    
    // Log dữ liệu bài đọc để debug
    console.log('=== DEBUG BÀI ĐỌC ===');
    console.log('selectedPassage:', selectedPassage);
    console.log('selectedPassage.passage_data:', selectedPassage.passage_data);
    console.log('selectedPassage.content:', selectedPassage.content);
    console.log('=== END DEBUG BÀI ĐỌC ===');
    
    // Thử đọc từ passage_data trước, nếu không có thì dùng content
    let readingData = null;
    if (selectedPassage.passage_data) {
      readingData = { ...selectedPassage.passage_data };
      // Nếu paragraphs là mảng chuỗi, tự động chuyển thành object {id, content}
      if (Array.isArray(readingData.paragraphs) && typeof readingData.paragraphs[0] === 'string') {
        readingData.paragraphs = (readingData.paragraphs as string[]).map((p: string, idx: number) => {
          const match = p.match(/^([A-Z])\.\s*(.*)$/);
          if (match) {
            return { id: match[1], content: match[2] };
          }
          return { id: String.fromCharCode(65 + idx), content: p };
        });
      }
    } else {
      // Fallback: tạo cấu trúc từ content cũ
      const paragraphs = selectedPassage.content.split('\n\n');
      readingData = {
        title: selectedPassage.title,
        paragraphs: paragraphs.map((p, index) => {
          const match = p.match(/^\[([A-Z])\]\s*(.*)/);
          if (match) {
            return { id: match[1], content: match[2] };
          } else {
            // Nếu không có format [A], [B], ... thì tạo ID tự động
            return { id: String.fromCharCode(65 + index), content: p };
          }
        }).filter(p => p.content && p.content.trim() !== '') // Lọc bỏ paragraph rỗng
      };
    }
    
    if (!readingData || !readingData.paragraphs || readingData.paragraphs.length === 0) {
      return <div className="text-gray-200">Không có nội dung bài đọc</div>;
    }
    
    // Xử lý nội dung bài đọc với định dạng đoạn văn
    const formatReadingContent = (paragraphs: any[]) => {
      return paragraphs.map((paragraph, index) => {
        // Đảm bảo paragraph có cấu trúc đúng
        if (!paragraph || typeof paragraph !== 'object') {
          return null;
        }
        
        const id = paragraph.id || String.fromCharCode(65 + index);
        const content = paragraph.content || paragraph.text || '';
        
        if (!content || content.trim() === '') {
          return null;
        }
        
        return (
          <div key={index} className="mb-4">
            <div className="flex items-start">
              <span className="bg-primary-500 text-white px-2 py-1 rounded text-sm font-bold mr-3 mt-1 min-w-[2rem] text-center">
                {id}
        </span>
              <div className="flex-1 leading-relaxed">
                {content}
              </div>
            </div>
          </div>
        );
      }).filter(Boolean); // Lọc bỏ null
    };
    
    if (highlightedRangesReading.length === 0) {
      return <div className="text-gray-200">{formatReadingContent(readingData.paragraphs)}</div>;
    }
    
    // Khi có highlight, tạm thời sử dụng cách hiển thị đơn giản
    return <div className="text-gray-200 whitespace-pre-wrap">{formatReadingContent(readingData.paragraphs)}</div>;
  };

  // Render panel câu hỏi với highlight nhưng vẫn giữ UI động
  const renderQuestionPanel = () => {
    return (
      <>
        <h2 className="text-xl font-bold text-gray-50 mb-6">Câu hỏi</h2>
        {questionGroups.map((group, groupIndex) => {
          // Tạo range câu hỏi (ví dụ: "Questions 14-19")
          const firstQuestion = group.questions[0];
          const lastQuestion = group.questions[group.questions.length - 1];
          const questionRange = firstQuestion && lastQuestion 
            ? `Questions ${firstQuestion.order_index}-${lastQuestion.order_index}`
            : `Group ${groupIndex + 1}`;

          // Nếu là dạng choose TWO (2 câu hỏi, options >= 2), chỉ render 1 lần option cho cả group
          let groupOptions: Record<string, string> | undefined = group.options as Record<string, string>;
          if (typeof groupOptions === 'string') {
            try {
              groupOptions = JSON.parse(groupOptions) as Record<string, string>;
            } catch (e) {
              groupOptions = {};
            }
          }
          if (!groupOptions || typeof groupOptions !== 'object') groupOptions = {};
          const optionEntries: [string, string][] = Object.entries(groupOptions) as [string, string][];
          if (group.question_type === 'multiple_choice_group' && group.questions.length === 2 && optionEntries.length >= 2) {
            // Đúng chuẩn IELTS: chỉ render 1 block option cho cả group
            return (
              <div key={group.id} className="mb-8 rounded-2xl overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-blue-600 to-blue-400 px-6 py-4 flex items-center">
                  <span className="text-2xl font-extrabold text-white tracking-wide mr-3">Questions {group.questions[0].order_index}-{group.questions[1].order_index}</span>
              </div>
                <div className="bg-gray-100 px-6 py-5 text-gray-800 text-base leading-relaxed border-l-4 border-blue-400">
                  <div>{group.instructions}</div>
            </div>
                {/* Render 1 lần block option cho cả group, đồng bộ style */}
                <div className="bg-gray-700 rounded-b-lg p-4">
                  <div className="mb-4 text-lg text-gray-100 font-semibold">Which TWO of the following statements does the writer make about ...?</div>
                  {optionEntries.map(([key, value], index) => {
                    const groupAnswer: string[] = Array.isArray(userAnswers[group.id]) ? userAnswers[group.id] as string[] : typeof userAnswers[group.id] === 'string' ? [userAnswers[group.id] as string] : [];
                    const checked = groupAnswer.includes(String(key));
                    const disabled = !checked && groupAnswer.length >= 2;
                    return (
                      <label key={key} className={`flex items-center space-x-3 cursor-pointer p-2 rounded ${disabled ? 'opacity-60' : ''}`}> 
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={e => {
                            let newAnswers = Array.isArray(groupAnswer) ? [...groupAnswer] : [];
                            if (e.target.checked) {
                              if (newAnswers.length < 2) newAnswers.push(String(key));
                            } else {
                              newAnswers = newAnswers.filter(ans => ans !== String(key));
                            }
                            handleGroupAnswerChange(group.id, newAnswers);
                          }}
                        />
                        <span className="font-semibold text-yellow-200">{String(key)}.</span>
                        <span>{String(value)}</span>
                      </label>
                    );
                  })}
                  <div className="text-xs text-gray-400 mt-1">Chỉ được chọn 2 đáp án cho cả nhóm câu hỏi này.</div>
                </div>
              </div>
            );
          }

          // Các group khác vẫn render như cũ
                return (
            <div key={group.id} className="mb-8 rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 px-6 py-4 flex items-center">
                <span className="text-2xl font-extrabold text-white tracking-wide mr-3">{questionRange}</span>
                    </div>
              <div className="bg-gray-100 px-6 py-5 text-gray-800 text-base leading-relaxed border-l-4 border-blue-400">
                <div>{group.instructions}</div>
              </div>
              {/* Nếu là summary_completion thì hiển thị đoạn summary/content với input inline */}
              {group.question_type === 'summary_completion' && group.content && (
                <div className="bg-yellow-100 text-gray-900 rounded-lg p-4 mb-4 border-l-4 border-yellow-400">
                  <div className="font-semibold mb-2">Summary:</div>
                  <span style={{display: 'inline', lineHeight: '2.2', width: '100%'}}>
                    {typeof group.content === 'string'
                      ? (() => {
                          // Tự động tách các đoạn ______, ___, ... thành input inline
                          const regex = /(\_{3,}|\.{3,}|\s*_{2,}\s*|\s*\.\.\.\s*)/g;
                          let lastIndex = 0;
                          let match;
                          let blankIndex = 0;
                          const elements = [];
                          while ((match = regex.exec(group.content)) !== null) {
                            if (match.index > lastIndex) {
                              elements.push(<span key={`text-${lastIndex}`}>{group.content.slice(lastIndex, match.index)}</span>);
                            }
                            const qid = group.questions[blankIndex]?.id;
                            elements.push(
                              <input
                                key={`input-${blankIndex}`}
                                type="text"
                                value={userAnswers[qid] || ''}
                                onChange={e => handleAnswer(qid, e.target.value)}
                                style={{ display: 'inline-block', minWidth: 60, maxWidth: 120, borderBottom: '2px solid #888', margin: '0 4px', background: '#fffbe6', textAlign: 'center' }}
                                placeholder="..."
                                autoComplete="off"
                              />
                            );
                            lastIndex = match.index + match[0].length;
                            blankIndex++;
                          }
                          if (lastIndex < group.content.length) {
                            elements.push(<span key={`text-end`}>{group.content.slice(lastIndex)}</span>);
                          }
                          return elements;
                        })()
                      : Array.isArray(group.content)
                        ? group.content.flatMap((item: any, idx: number) => {
                            if (item.type === 'text') {
                              // Tìm tất cả các dấu ______ trong value
                              const regex = /_{3,}/g;
                              let lastIndex = 0;
                              let match;
                              let elements = [];
                              let blankIndex = 0;
                              while ((match = regex.exec(item.value)) !== null) {
                                if (match.index > lastIndex) {
                                  elements.push(<span key={`text-${idx}-${lastIndex}`}>{item.value.slice(lastIndex, match.index)}</span>);
                                }
                                const qid = group.questions[blankIndex]?.id;
                                elements.push(
                                  <input
                                    key={`input-${idx}-${blankIndex}`}
                                    type="text"
                                    value={userAnswers[qid] || ''}
                                    onChange={e => handleAnswer(qid, e.target.value)}
                                    style={{ display: 'inline-block', minWidth: 60, maxWidth: 120, borderBottom: '2px solid #888', margin: '0 4px', background: '#fffbe6', textAlign: 'center' }}
                                    placeholder="..."
                                    autoComplete="off"
                                  />
                                );
                                lastIndex = match.index + match[0].length;
                                blankIndex++;
                              }
                              if (lastIndex < item.value.length) {
                                elements.push(<span key={`text-${idx}-end`}>{item.value.slice(lastIndex)}</span>);
                              }
                              return elements;
                            }
                            if (item.type === 'blank') {
                              const qid = group.questions[idx]?.id;
                              return (
                                <input
                                  key={`input-${idx}`}
                                  type="text"
                                  value={userAnswers[qid] || ''}
                                  onChange={e => handleAnswer(qid, e.target.value)}
                                  style={{ display: 'inline-block', minWidth: 60, maxWidth: 120, borderBottom: '2px solid #888', margin: '0 4px', background: '#fffbe6', textAlign: 'center' }}
                                  placeholder="..."
                                  autoComplete="off"
                                />
                              );
                            }
                            return null;
                          })
                        : null}
                  </span>
                  {/* Nút và hiển thị hướng dẫn cho summary_completion nếu có */}
                  {(group.guide || group.explanation || (group.questions && group.questions[0]?.guide)) && (
                    <div className="mt-4">
                      <button
                        className="px-3 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300 font-semibold text-sm"
                        onClick={() => setOpenGuides(prev => ({...prev, [group.id]: !prev[group.id]}))}
                      >
                        {openGuides[group.id] ? 'Ẩn hướng dẫn' : 'Hướng dẫn'}
                      </button>
                      {openGuides[group.id] && (
                        <div className="mt-2 text-sm text-blue-700 italic">
                          {highlightGuideText(group.guide || group.explanation || group.questions[0]?.guide || '')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Render từng câu hỏi, nhưng nếu là summary_completion thì KHÔNG render gì cả (ẩn hoàn toàn các ô nhập riêng biệt) */}
              {group.question_type !== 'summary_completion' && (
                <div className="bg-gray-700 rounded-b-lg p-4">
                  {group.questions.map((question, qidx) => (
                    <div key={question.id} className="mb-8 rounded-2xl border border-blue-400 bg-gray-800 shadow-lg p-6">
                      <div className="flex mb-4">
                        <div className="flex-shrink-0 text-lg font-semibold text-green-300 min-w-[120px]">Question {question.order_index}.</div>
                        <div className="text-gray-100 text-lg">{question.question_text}</div>
                    </div>
                    {renderQuestionOptions(question, group.question_type)}
                      {/* Nút và hiển thị hướng dẫn cho từng câu hỏi nếu có */}
                      {(question.guide || question.explanation) && (
                        <div className="mt-2">
                          <button
                            className="px-3 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300 font-semibold text-sm"
                            onClick={() => setOpenGuides(prev => ({...prev, [question.id]: !prev[question.id]}))}
                          >
                            {openGuides[question.id] ? 'Ẩn hướng dẫn' : 'Hướng dẫn'}
                          </button>
                          {openGuides[question.id] && (
                            <div className="mt-2 text-sm text-blue-300 italic">
                              {highlightGuideText(question.guide || question.explanation || '')}
                  </div>
                          )}
            </div>
                      )}
          </div>
        ))}
                </div>
              )}
            </div>
          );
        })}
        {/* Submit button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={finishTest}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-lg"
          >
            Nộp bài
          </button>
        </div>
      </>
    );
  };



  // Khi showTranslatePopup chuyển từ false -> true, nếu chưa từng kéo thì đặt vị trí mặc định
  useEffect(() => {
    if (showTranslatePopup && !translatePopupPos) {
      setTranslatePopupPos({
        x: toolbarPos.x,
        y: toolbarPos.y + 36
      });
    }
    if (!showTranslatePopup) {
      setTranslatePopupPos(null);
    }
  }, [showTranslatePopup, toolbarPos]);

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

  // Reset trạng thái lưu từ khi mở popup dịch mới
  useEffect(() => {
    if (showTranslatePopup) {
      setSaveTermStatus('idle');
      setSaveTermMsg('');
    }
  }, [showTranslatePopup]);

  // Hàm lưu từ/cụm từ
  const handleSaveTerm = async () => {
    setSaveTermStatus('saving');
    setSaveTermMsg('');
    // Luôn dùng partOfSpeech state
    try {
      const res = await fetch('/api/vocab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.uid ? { 'firebase_uid': user.uid } : {})
        },
        body: JSON.stringify({ vocab: selectedText, meaning: viMeaning, part_of_speech: partOfSpeech })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveTermStatus('success');
        setSaveTermMsg('Đã lưu!');
      } else {
        setSaveTermStatus('error');
        setSaveTermMsg(data.message || 'Lưu thất bại!');
      }
    } catch (e) {
      setSaveTermStatus('error');
      setSaveTermMsg('Lỗi khi lưu từ/cụm từ!');
    }
  };

  // Hàm lấy giải thích chi tiết từ Gemini
  const getExplanation = async (questionId: number, question: Question, userAnswer: string) => {
    setExplanationLoading(prev => ({ ...prev, [questionId]: true }));
    try {
      const response = await fetch('/api/admin/explain-ielts-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: selectedPassage?.content || '',
          question: question.question_text,
          questionType: question.question_type,
          correctAnswer: question.correct_answer,
          userAnswer: String(userAnswer),
          options: question.options || []
        })
      });
      
      if (!response.ok) {
        throw new Error('Lỗi khi lấy giải thích');
      }
      
      const data = await response.json();
      setExplanations(prev => ({ ...prev, [questionId]: data.explanation }));
    } catch (error) {
      console.error('Lỗi khi lấy giải thích:', error);
      setExplanations(prev => ({ ...prev, [questionId]: 'Không thể lấy giải thích. Vui lòng thử lại.' }));
    } finally {
      setExplanationLoading(prev => ({ ...prev, [questionId]: false }));
    }
  };

  // Thêm effect riêng cho popup xóa highlight
  useEffect(() => {
    if (!showRemoveHighlight) return;
    const handleRemoveHighlightClick = (e: MouseEvent) => {
      const removeHighlightPopup = document.querySelector('[data-remove-highlight-popup]');
      if (removeHighlightPopup && removeHighlightPopup.contains(e.target as Node)) return;
      setShowRemoveHighlight(false);
    };
    document.addEventListener('mousedown', handleRemoveHighlightClick);
    return () => {
      document.removeEventListener('mousedown', handleRemoveHighlightClick);
    };
  }, [showRemoveHighlight]);

  // Hàm cập nhật đáp án cho group (dạng choose TWO)
  const handleGroupAnswerChange = (groupId: string, newAnswers: string[]) => {
    setUserAnswers(prev => ({
      ...prev,
      [groupId]: newAnswers
    }));
  };

  const [openGuides, setOpenGuides] = useState<{[key: string]: boolean}>({});

  // Hàm format highlight cho guide/explanation với nhiều kiểu khác nhau, bổ sung '...' (một nháy đơn)
  function highlightGuideText(text: string) {
    if (!text) return null;
    // Regex nhận diện từng loại
    const regex = /('''(.*?)'''|"""(.*?)"""|''(.*?)''|'([^']+)'|\(([^()]+)\))/g;
    const elements = [];
    let lastIndex = 0;
    let match;
    let idx = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(<span key={`gtext-${idx}`}>{text.slice(lastIndex, match.index)}</span>);
        idx++;
      }
      let highlightText = match[2] || match[3] || match[4] || match[5] || match[6] || match[0];
      let style = {};
      if (match[2]) { // '''...'''
        style = { background: '#fffbe6', color: '#b45309', fontWeight: 600, borderRadius: 4, padding: '0 3px' };
      } else if (match[3]) { // """..."""
        style = { background: '#dbeafe', color: '#1e40af', fontWeight: 600, borderRadius: 4, padding: '0 3px' };
      } else if (match[4]) { // ''...''
        style = { background: '#fce7f3', color: '#be185d', fontWeight: 600, borderRadius: 4, padding: '0 3px' };
      } else if (match[5]) { // '...'
        style = { background: '#fef3c7', color: '#ea580c', fontWeight: 600, borderRadius: 4, padding: '0 3px' };
      } else if (match[6]) { // (...)
        style = { background: '#ede9fe', color: '#7c3aed', fontWeight: 600, borderRadius: 4, padding: '0 3px' };
      }
      elements.push(
        <span key={`ghighlight-${idx}`} style={style}>{highlightText}</span>
      );
      lastIndex = match.index + match[0].length;
      idx++;
    }
    if (lastIndex < text.length) {
      elements.push(<span key={`gtext-end`}>{text.slice(lastIndex)}</span>);
    }
    return elements;
  }

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
                className="overflow-y-auto p-6 flex-1 min-w-0 invisible-scrollbar select-text"
                style={{ width: `${100 - readingPanelWidth}%`, maxWidth: `${100 - readingPanelWidth}%`, fontSize: `${questionFontSize}px`, lineHeight: 1.6 }}
                ref={questionPanelRef}
              >
                <div style={{ fontSize: `${questionFontSize}px`, lineHeight: 1.6 }}>
                  {/* Override font size cho toàn bộ panel câu hỏi */}
                  <style>{`
                    .ielts-question-panel * {
                      font-size: ${questionFontSize}px !important;
                    }
                  `}</style>
                  <div className="ielts-question-panel">
                {renderQuestionPanel()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showTranslatePopup && translatePopupPos && (
          <div
            data-translate-popup
            onMouseDown={e => {
              setDraggingTranslate(true);
              setDragOffset({
                x: e.clientX - translatePopupPos.x,
                y: e.clientY - translatePopupPos.y
              });
              e.stopPropagation();
            }}
            onMouseUp={e => { setDraggingTranslate(false); e.stopPropagation(); }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
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
            <div className="text-lg mb-2">{viMeaning}</div>
            <div style={{display: 'flex', gap: 8, marginTop: 8}}>
              <button
                onClick={handleSaveTerm}
                disabled={saveTermStatus === 'saving'}
                style={{background: '#f1f5f9', color: '#2563eb', border: 'none', borderRadius: 4, padding: '6px 14px', fontWeight: 600, cursor: 'pointer'}}
              >
                {saveTermStatus === 'saving' ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={() => window.open(`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(selectedText)}`, '_blank')}
                style={{background: '#f1f5f9', color: '#0e7490', border: 'none', borderRadius: 4, padding: '6px 14px', fontWeight: 600, cursor: 'pointer'}}
              >
                Tra Cambridge
              </button>
            </div>
            {saveTermStatus !== 'idle' && saveTermMsg && (
              <div style={{marginTop: 6, fontSize: 13, color: saveTermStatus === 'success' ? '#16a34a' : '#b91c1c'}}>{saveTermMsg}</div>
            )}
          </div>
        )}
        {showColorPicker && (
          <div
            data-color-picker-popup
            onMouseDown={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: colorPickerPos.x,
              top: colorPickerPos.y,
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
        {showToolbar && selectedText && (
          <div
            onMouseDown={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: toolbarPos.x,
              top: toolbarPos.y,
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
            <button 
              onClick={handleAiTranslate} 
              disabled={aiTranslateLoading}
              title="Dịch AI (thông minh, có part of speech)" 
              className="p-2 hover:bg-green-100 rounded flex items-center justify-center" 
              style={{minWidth: 36, minHeight: 36}}
            >
              {aiTranslateLoading ? (
                <svg className="animate-spin h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              ) : (
                <AiTranslateIcon />
              )}
            </button>
            <button 
              onClick={handleCloudTranslate} 
              disabled={cloudTranslateLoading}
              title="Dịch nhanh (Cloud Translation)" 
              className="p-2 hover:bg-blue-100 rounded flex items-center justify-center" 
              style={{minWidth: 36, minHeight: 36}}
            >
              {cloudTranslateLoading ? (
                <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              ) : (
                <CloudTranslateIcon />
              )}
            </button>
          </div>
        )}
        {showRemoveHighlight && removeHighlightPos && (
          <div
            data-remove-highlight-popup
            style={{
              position: 'fixed',
              left: removeHighlightPos.x,
              top: removeHighlightPos.y,
              zIndex: 2000,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <button
              onClick={handleRemoveHighlight}
              style={{color: '#b91c1c', fontWeight: 600, background: '#fee2e2', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer'}}
            >
              Xóa highlight
            </button>
            <button
              onClick={(e) => {
                setShowRemoveHighlight(false);
                handleOpenNote(e, currentQuestionId || undefined, highlightToRemove || undefined);
              }}
              style={{color: '#2563eb', fontWeight: 600, background: '#dbeafe', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer'}}
            >
              Ghi chú
            </button>
            <button
              onClick={() => setShowRemoveHighlight(false)}
              style={{color: '#222', background: '#eee', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer'}}
            >
              Đóng
            </button>
          </div>
        )}
        
        {/* Popup note */}
        {showNotePopup && notePopupPos && (
          <div
            data-note-popup
            style={{
              position: 'fixed',
              left: notePopupPos.x,
              top: notePopupPos.y,
              zIndex: 2001,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              padding: '12px',
              minWidth: 250,
              maxWidth: 300
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: '8px', fontWeight: 600, color: '#333' }}>
              Ghi chú
            </div>
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Nhập ghi chú của bạn..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '14px',
                color: '#222' // Thêm màu chữ tối
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={handleSaveNote}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Lưu
              </button>
              <button
                onClick={handleDeleteNote}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Xóa
              </button>
              <button
                onClick={() => {
                  setShowNotePopup(false);
                  setCurrentNote('');
                  setNoteToEdit(null);
                }}
                style={{
                  background: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
        
        {/* Thông báo lưu note thành công */}
        {showNoteSavedMessage && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 2002,
              background: '#10b981',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            ✓ Ghi chú đã được lưu thành công!
          </div>
        )}
        
        {/* Popup xem note (chỉ đọc) */}
        {showNoteViewPopup && noteViewPos && (
          <div
            style={{
              position: 'fixed',
              left: noteViewPos.x,
              top: noteViewPos.y,
              zIndex: 2001,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              padding: '12px',
              minWidth: 200,
              maxWidth: 300
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: '8px', fontWeight: 600, color: '#333' }}>
              Ghi chú
            </div>
            <div
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: '#f9f9f9',
                minHeight: '60px',
                maxHeight: '120px',
                overflowY: 'auto',
                fontSize: '14px',
                color: '#222',
                whiteSpace: 'pre-wrap'
              }}
            >
              {noteViewContent || 'Không có ghi chú'}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setShowNoteViewPopup(false);
                  setNoteViewContent('');
                }}
                style={{
                  background: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
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
                onClick={() => setShowDetailedResults(true)}
                className="px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700"
              >
                Xem chi tiết bài làm
              </button>
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

  // Component hiển thị chi tiết bài làm
  if (showDetailedResults) {
    const allQuestions = questionGroups.flatMap(group => group.questions);
    
    return (
      <>
        {timerModal}
        <div className="min-h-screen bg-gray-800 py-6 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-50">Chi tiết bài làm</h1>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowDetailedResults(false)}
                    className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500"
                  >
                    Quay lại kết quả
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailedResults(false);
                      setShowResults(false);
                      setSelectedPassage(null);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Làm bài khác
                  </button>
                </div>
              </div>
              <div className="mt-4 text-gray-300">
                <p>Điểm số: {testResults.score}% ({testResults.correctAnswers}/{testResults.totalQuestions} câu đúng)</p>
                <p>Thời gian làm bài: {formatTime(testResults.timeTaken)}</p>
                <p>Thời gian trung bình mỗi câu: {formatTime(Math.round(testResults.timeTaken / testResults.totalQuestions))}</p>
                <p>Bài đọc: {selectedPassage?.title}</p>
                <p>Số highlight: {highlightedRangesReading.length + Object.values(highlightedRangesQuestion).reduce((sum, ranges) => sum + ranges.length, 0)}</p>
                <p>Số ghi chú: {highlightedRangesReadingWithNotes.filter(r => r.note && r.note.trim() !== '').length + Object.values(highlightedRangesQuestionWithNotes).reduce((sum, ranges) => sum + ranges.filter(r => r.note && r.note.trim() !== '').length, 0)}</p>
                <p>Tỷ lệ đúng: {Math.round((testResults.correctAnswers / testResults.totalQuestions) * 100)}%</p>
                <p>Hiệu suất: {testResults.correctAnswers === testResults.totalQuestions ? 'Xuất sắc' : testResults.correctAnswers >= testResults.totalQuestions * 0.8 ? 'Tốt' : testResults.correctAnswers >= testResults.totalQuestions * 0.6 ? 'Khá' : 'Cần cải thiện'}</p>
                
                {/* Thống kê theo loại câu hỏi */}
                {(() => {
                  const typeStats: {[key: string]: {correct: number, total: number}} = {};
                  allQuestions.forEach(q => {
                    const type = q.question_type;
                    if (!typeStats[type]) {
                      typeStats[type] = { correct: 0, total: 0 };
                    }
                    typeStats[type].total++;
                    if (userAnswers[q.id] === q.correct_answer) {
                      typeStats[type].correct++;
                    }
                  });
                  
                  const typeNames: {[key: string]: string} = {
                    'multiple_choice': 'Trắc nghiệm (4 đáp án)',
                    'multiple_choice_5': 'Trắc nghiệm (5 đáp án, 2 đáp án đúng)',
                    'multiple_choice_group': 'Nhóm trắc nghiệm (5 đáp án, 2 câu hỏi)',
                    'true_false_not_given': 'True/False/Not Given',
                    'yes_no_not_given': 'Yes/No/Not Given',
                    'sentence_completion': 'Hoàn thành câu',
                    'summary_completion': 'Hoàn thành tóm tắt',
                    'note_completion': 'Hoàn thành ghi chú',
                    'short_answer_questions': 'Câu trả lời ngắn'
                  };
                  
                  return (
                    <div className="mt-3 p-3 bg-gray-600 rounded">
                      <div className="text-sm font-semibold mb-2">Thống kê theo loại câu hỏi:</div>
                      <div className="space-y-1">
                        {Object.entries(typeStats).map(([type, stats]) => (
                          <div key={type} className="text-sm">
                            <span className="text-gray-400">{typeNames[type] || type}:</span>
                            <span className={`ml-2 ${stats.correct === stats.total ? 'text-green-400' : 'text-yellow-400'}`}>
                              {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Thống kê theo thứ tự câu hỏi */}
                      <div className="mt-3 pt-3 border-t border-gray-500">
                        <div className="text-sm font-semibold mb-2">Thống kê theo thứ tự:</div>
                        <div className="grid grid-cols-5 gap-1">
                          {allQuestions.map((q, idx) => {
                            const isCorrect = userAnswers[q.id] === q.correct_answer;
                            return (
                              <div 
                                key={q.id} 
                                className={`text-xs p-1 rounded text-center ${
                                  isCorrect ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                                }`}
                                title={`Câu ${q.order_index}: ${isCorrect ? 'Đúng' : 'Sai'}`}
                              >
                                {q.order_index}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bài đọc với highlight */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-50 mb-4">Bài đọc</h2>
                <div className="bg-gray-600 rounded-lg p-4">
                  <div
                    className="text-gray-200 leading-relaxed whitespace-pre-wrap"
                    style={{ fontSize: `${readingFontSize}px` }}
                  >
                    {renderReadingContent()}
                  </div>
                </div>
                
                {/* Hiển thị note cho bài đọc nếu có */}
                {(() => {
                  const notes = highlightedRangesReadingWithNotes.filter(range => range.note && range.note.trim() !== '');
                  
                  if (notes.length > 0) {
                    return (
                      <div className="mt-4 p-4 bg-yellow-900 rounded-lg">
                        <h3 className="font-semibold text-yellow-200 mb-3">Ghi chú bài đọc:</h3>
                        {notes.map((range, idx) => (
                          <div key={idx} className="text-yellow-100 mb-3 p-3 bg-yellow-800 rounded">
                            <div className="text-sm opacity-75 mb-2">
                              Highlight: "{selectedPassage?.content.slice(range.start, range.end)}"
                            </div>
                            <div className="whitespace-pre-wrap">{range.note}</div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Chi tiết câu hỏi */}
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-50">Chi tiết câu hỏi</h2>
                  <button
                    onClick={() => {
                      if (showAllExplanations) {
                        setExplanations({});
                        setShowAllExplanations(false);
                      } else {
                        setShowAllExplanations(true);
                        // Lấy giải thích cho tất cả câu hỏi sai
                        allQuestions.forEach(q => {
                          const userAns = userAnswers[q.id] ?? '';
                          if (userAns !== q.correct_answer) {
                            getExplanation(q.id, q, String(userAns));
                          }
                        });
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    {showAllExplanations ? 'Ẩn tất cả giải thích' : 'Hiển thị giải thích câu sai'}
                  </button>
                </div>
                <div className="space-y-6">
                  {allQuestions.map((question, index) => {
                    const userAnswer = userAnswers[question.id] ?? '';
                    const isCorrect = userAnswer === question.correct_answer;
                    
                    return (
                      <div key={question.id} className="bg-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-lg font-semibold text-primary-200">
                              Câu {question.order_index}
                            </span>
                            <div className="text-sm text-gray-400 mt-1">
                              Loại: {(() => {
                                const typeMap: {[key: string]: string} = {
                                  'multiple_choice': 'Trắc nghiệm (4 đáp án)',
                                  'multiple_choice_5': 'Trắc nghiệm (5 đáp án, 2 đáp án đúng)',
                                  'multiple_choice_group': 'Nhóm trắc nghiệm (5 đáp án, 2 câu hỏi)',
                                  'true_false_not_given': 'True/False/Not Given',
                                  'yes_no_not_given': 'Yes/No/Not Given',
                                  'matching_headings': 'Nối tiêu đề',
                                  'matching_information': 'Nối thông tin',
                                  'matching_features': 'Nối đặc điểm',
                                  'matching_sentence_endings': 'Nối kết thúc câu',
                                  'sentence_completion': 'Hoàn thành câu',
                                  'summary_completion': 'Hoàn thành tóm tắt',
                                  'note_completion': 'Hoàn thành ghi chú',
                                  'table_completion': 'Hoàn thành bảng',
                                  'flow_chart_completion': 'Hoàn thành sơ đồ',
                                  'diagram_labelling': 'Gắn nhãn sơ đồ',
                                  'short_answer_questions': 'Câu trả lời ngắn'
                                };
                                return typeMap[question.question_type] || question.question_type;
                              })()}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isCorrect ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                          }`}>
                            {isCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                        
                        <div className="text-gray-200 mb-3">
                          <strong>Câu hỏi:</strong> 
                          <div className="mt-2">
                            {(() => {
                              const questionRanges = highlightedRangesQuestion[question.id] || [];
                              if (questionRanges.length === 0) {
                                return <span>{question.question_text}</span>;
                              }
                              
                              let parts: React.ReactNode[] = [];
                              let last = 0;
                              const sorted = [...questionRanges].sort((a, b) => a.start - b.start);
                              
                              sorted.forEach(({start, end, color}, idx) => {
                                if (last < start) parts.push(question.question_text.slice(last, start));
                                parts.push(
                                  <mark
                                    key={idx}
                                    style={{background: color, color: '#222', padding: '2px 4px', borderRadius: '3px'}}
                                  >
                                    {question.question_text.slice(start, end)}
                                  </mark>
                                );
                                last = end;
                              });
                              
                              if (last < question.question_text.length) {
                                parts.push(question.question_text.slice(last));
                              }
                              
                              return <>{parts}</>;
                            })()}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="text-gray-300">
                            <strong>Đáp án của bạn:</strong> 
                            <span className={`ml-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              {question.question_type === 'multiple_choice_5' && userAnswer ? 
                                (typeof userAnswer === 'string' ? userAnswer.split(',').map((a: string) => a.trim()).join(', ') : Array.isArray(userAnswer) ? userAnswer.join(', ') : '') : 
                                (typeof userAnswer === 'string' ? userAnswer : 'Không trả lời')}
                            </span>
                          </div>
                          <div className="text-gray-300">
                            <strong>Đáp án đúng:</strong> 
                            <span className="ml-2 text-green-400">
                              {question.question_type === 'multiple_choice_5' && question.correct_answer ? 
                                question.correct_answer.split(',').map((a: string) => a.trim()).join(', ') : 
                                question.correct_answer}
                            </span>
                          </div>
                          
                          {/* Hiển thị các lựa chọn cho câu hỏi trắc nghiệm */}
                          {question.options && question.options.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-700 rounded">
                              <div className="text-sm text-gray-400 mb-2">Các lựa chọn:</div>
                              <div className="space-y-1">
                                {question.options.map((option, idx) => {
                                  const isCorrectAnswer = question.question_type === 'multiple_choice_5' ? 
                                    question.correct_answer && question.correct_answer.split(',').map((a: string) => a.trim()).includes(option) :
                                    option === question.correct_answer;
                                  const isUserAnswer = question.question_type === 'multiple_choice_5' ? 
                                    userAnswer && (typeof userAnswer === 'string' ? userAnswer.split(',').map((a: string) => a.trim()).includes(option) : Array.isArray(userAnswer) ? userAnswer.includes(option) : false) :
                                    option === userAnswer;
                                  
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`text-sm p-2 rounded ${
                                        isCorrectAnswer 
                                          ? 'bg-green-900 text-green-200 border border-green-600' 
                                          : isUserAnswer && !isCorrect
                                          ? 'bg-red-900 text-red-200 border border-red-600'
                                          : 'bg-gray-800 text-gray-300'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + idx)}. {option}
                                      {isCorrectAnswer && ' ✓'}
                                      {isUserAnswer && !isCorrect && ' ✗'}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Nút giải thích */}
                        <div className="mt-4">
                          <button
                            onClick={() => getExplanation(question.id, question, String(userAnswer))}
                            disabled={explanationLoading[question.id]}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {explanationLoading[question.id] ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                                Đang tải...
                              </span>
                            ) : (
                              'Giải thích chi tiết'
                            )}
                          </button>
                        </div>

                        {/* Hiển thị note nếu có */}
                        {(() => {
                          const questionRangesWithNotes = highlightedRangesQuestionWithNotes[question.id] || [];
                          const notes = questionRangesWithNotes.filter(range => range.note && range.note.trim() !== '');
                          
                          if (notes.length > 0) {
                            return (
                              <div className="mt-3 p-3 bg-yellow-900 rounded-lg">
                                <h4 className="font-semibold text-yellow-200 mb-2">Ghi chú của bạn:</h4>
                                {notes.map((range, idx) => (
                                  <div key={idx} className="text-yellow-100 mb-2">
                                    <div className="text-sm opacity-75 mb-1">
                                      Highlight: "{question.question_text.slice(range.start, range.end)}"
                                    </div>
                                    <div className="whitespace-pre-wrap">{range.note}</div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Hiển thị giải thích */}
                        {explanations[question.id] && (
                          <div className="mt-4 p-4 bg-blue-900 rounded-lg">
                            <h4 className="font-semibold text-blue-200 mb-2">Giải thích:</h4>
                            <div className="text-blue-100 whitespace-pre-wrap">
                              {explanations[question.id]}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Footer với thông tin bổ sung */}
            <div className="mt-6 bg-gray-700 rounded-lg p-4">
              <div className="text-center text-gray-400 text-sm">
                <p>💡 Mẹo: Sử dụng nút "Hiển thị giải thích câu sai" để xem giải thích chi tiết cho tất cả câu hỏi bạn trả lời sai</p>
                <p>📝 Các highlight và ghi chú của bạn sẽ được lưu lại để tham khảo sau này</p>
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