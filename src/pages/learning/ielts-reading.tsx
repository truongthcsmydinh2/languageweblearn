import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
import Layout from '@/components/common/Layout';
import { Palette, BookOpen, Languages, Save, X, FileText, Info, List } from 'lucide-react';
import { toast } from 'sonner';

interface Passage {
  id: number;
  title: string;
  content: string;
  passage_data?: any;
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
  options?: any;
  content?: any;
  guide?: string;
  explanation?: string;
}

const IeltsReadingPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string | string[]}>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [readingPanelWidth, setReadingPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{[key: number]: boolean}>({});
  const [readingFontSize, setReadingFontSize] = useState(16);
  const [questionFontSize, setQuestionFontSize] = useState(16);
  const [testResults, setTestResults] = useState({
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    timeTaken: 0
  });
  const [hideNavbar, setHideNavbar] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [pendingPassage, setPendingPassage] = useState<Passage | null>(null);
  const [pendingQuestionGroups, setPendingQuestionGroups] = useState<QuestionGroup[]>([]);
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);
  const [openGuides, setOpenGuides] = useState<{[key: string]: boolean}>({});
  const [showDictionary, setShowDictionary] = useState(false);
  const [dictionaryResult, setDictionaryResult] = useState<{
    word: string;
    meanings: string[];
    position: { x: number; y: number };
  } | null>(null);
  const [isDictionaryDragging, setIsDictionaryDragging] = useState(false);
  const [dictionaryDragOffset, setDictionaryDragOffset] = useState({ x: 0, y: 0 });
  const [dictionaryPosition, setDictionaryPosition] = useState({ x: 0, y: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [highlightColors] = useState(['#ffeb3b', '#ff9800', '#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3']);
  const [aiResult, setAiResult] = useState<any>(null);
  const [translateResult, setTranslateResult] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isLoadingTranslate, setIsLoadingTranslate] = useState(false);
  const [highlights, setHighlights] = useState<{[key: string]: string}>({});
  const [isPopupDragging, setIsPopupDragging] = useState(false);
  const [popupDragOffset, setPopupDragOffset] = useState({ x: 0, y: 0 });
  const [isHighlightedText, setIsHighlightedText] = useState(false);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
  const readingContentRef = useRef<HTMLDivElement>(null);
  const questionPanelRef = useRef<HTMLDivElement>(null);
  const dictionaryRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Helper function for highlighting guide text
  const highlightGuideText = (text: string) => {
    if (!text) return null;
    const regex = /(TRUE|FALSE|NOT GIVEN|YES|NO|[A-G])/g;
    return text.split(regex).map((part, index) => {
      if (regex.test(part)) {
        return (
          <span key={index} className="bg-yellow-200 text-gray-800 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    setOpenDropdowns(prev => ({
      ...prev,
      [questionId]: false
    }));
  };

  const handleGroupAnswerChange = (groupId: string, answers: string[]) => {
    setUserAnswers(prev => ({
      ...prev,
      [groupId]: answers
    }));
  };

  const finishTest = async () => {
    // Calculate score logic here
    let correctAnswers = 0;
    let totalQuestions = 0;

    questionGroups.forEach(group => {
      if (group.question_type === 'choose_two_letters') {
        // For choose_two_letters, count each question individually
        group.questions.forEach(question => {
          totalQuestions += 1;
          const groupAnswerKey = `group_${group.id}`;
          const selectedAnswers = userAnswers[groupAnswerKey] ? 
            (Array.isArray(userAnswers[groupAnswerKey]) ? userAnswers[groupAnswerKey] : userAnswers[groupAnswerKey].toString().split(',').filter(Boolean)) : [];
          
          // Get all correct answers from questions in this group
          const allCorrectAnswers = group.questions.map(q => q.correct_answer);
          
          // Check if user's answer for this question is correct
          const userAnswer = userAnswers[question.id];
          if (userAnswer && userAnswer === question.correct_answer) {
            correctAnswers += 1;
          }
        });
      } else {
        // For other question types, count each question individually
        group.questions.forEach(question => {
          totalQuestions += 1;
          const userAnswer = userAnswers[question.id];
          
          if (userAnswer === question.correct_answer) {
            correctAnswers += 1;
          }
        });
      }
    });

    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const timeTaken = selectedPassage ? selectedPassage.time_limit * 60 - timeLeft : 0;

    setTestResults({
      score,
      totalQuestions,
      correctAnswers,
      timeTaken
    });

    setShowResults(true);
    setIsTestActive(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const adjustFontSize = (type: 'reading' | 'question', increase: boolean) => {
    if (type === 'reading') {
      setReadingFontSize(prev => {
        const newSize = increase ? prev + 2 : prev - 2;
        return Math.max(12, Math.min(24, newSize));
      });
    } else {
      setQuestionFontSize(prev => {
        const newSize = increase ? prev + 2 : prev - 2;
        return Math.max(12, Math.min(24, newSize));
      });
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Save the selection range for later use
      setSavedSelection(range.cloneRange());
      
      // Check if clicked element is a highlighted span
      const clickedElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer as Element;
      
      if (clickedElement && clickedElement.tagName === 'SPAN' && clickedElement.style.backgroundColor) {
        // This is a highlighted text, show remove highlight option
        setSelectedText(text);
        setPopupPosition({ 
          x: rect.left + window.scrollX, 
          y: rect.top + window.scrollY - 60 
        });
        setShowPopup(true);
        setAiResult(null);
        setTranslateResult(null);
        setIsHighlightedText(true);
      } else {
        // Normal text selection
        setSelectedText(text);
        setPopupPosition({ 
          x: rect.left + window.scrollX, 
          y: rect.top + window.scrollY - 60 
        });
        setShowPopup(true);
        setAiResult(null);
        setTranslateResult(null);
        setIsHighlightedText(false);
      }
    }
  };

  const handleHighlight = (color: string) => {
    // Use saved selection instead of current selection
    if (savedSelection) {
      const span = document.createElement('span');
      span.style.backgroundColor = color;
      span.style.color = '#374151'; // Gray-700 color for better readability
      span.style.padding = '2px 4px';
      span.style.borderRadius = '3px';
      span.style.fontWeight = '500';
      
      try {
        // Clear current selection and restore saved selection
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(savedSelection);
        }
        
        savedSelection.surroundContents(span);
        setHighlights(prev => ({ ...prev, [selectedText]: color }));
        
        // Clear selection after highlighting to remove the blue selection
        if (selection) {
          selection.removeAllRanges();
        }
      } catch (e) {
        console.error('Error highlighting text:', e);
      }
    }
    setShowPopup(false);
    setSavedSelection(null);
  };

  const removeHighlight = () => {
    // Use saved selection if available, otherwise use current selection
    const selection = window.getSelection();
    let range = null;
    
    if (savedSelection) {
      range = savedSelection;
    } else if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    }
    
    if (range) {
      const clickedElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer as Element;
      
      if (clickedElement && clickedElement.tagName === 'SPAN' && clickedElement.style.backgroundColor) {
        // Replace the span with its text content
        const parent = clickedElement.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(clickedElement.textContent || ''), clickedElement);
          // Normalize the parent to merge adjacent text nodes
          parent.normalize();
        }
        // Remove from highlights state
        setHighlights(prev => {
          const newHighlights = { ...prev };
          delete newHighlights[selectedText];
          return newHighlights;
        });
      }
    }
    setShowPopup(false);
    setSavedSelection(null);
  };

  const handleAILookup = async () => {
    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/ai/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const result = await response.json();
      // Ensure we have all required fields
      setAiResult({
        word: selectedText,
        type: result.type || result.partOfSpeech || 'N/A',
        meaning: result.meaning || result.definition || 'Không tìm thấy nghĩa',
        example: result.example || result.exampleSentence || '',
        pronunciation: result.pronunciation || ''
      });
    } catch (error) {
      console.error('Error fetching AI result:', error);
      setAiResult({
        word: selectedText,
        type: 'N/A',
        meaning: 'Lỗi khi tìm kiếm nghĩa từ AI',
        example: '',
        pronunciation: ''
      });
    }
    setIsLoadingAI(false);
  };

  const handleTranslate = async () => {
    setIsLoadingTranslate(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText, targetLanguage: 'vi' })
      });
      const result = await response.json();
      setTranslateResult(result);
    } catch (error) {
      console.error('Error translating:', error);
    }
    setIsLoadingTranslate(false);
  };

  const handleSaveVocab = async () => {
    if (!aiResult || !selectedText || !user) return;
    
    try {
      const termData = {
        vocab: selectedText.trim(),
        meaning: aiResult.meaning,
        part_of_speech: aiResult.type && aiResult.type !== 'N/A' ? aiResult.type : undefined
      };
      
      const response = await fetch('/api/vocab/bulk-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user.uid
        },
        body: JSON.stringify({
          terms: [termData]
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.added > 0) {
          toast.success('Đã lưu từ vào từ điển!');
        } else if (result.duplicates > 0) {
          toast.warning('Từ này đã có trong từ điển!');
        }
        setShowPopup(false);
        setSavedSelection(null);
        setAiResult(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Có lỗi khi lưu từ vựng');
      }
    } catch (error) {
      console.error('Error saving vocab:', error);
      toast.error('Có lỗi khi lưu từ vựng');
    }
  };

  // Popup drag functions
  const handlePopupDragStart = (e: React.MouseEvent) => {
    if (popupRef.current) {
      setIsPopupDragging(true);
      const rect = popupRef.current.getBoundingClientRect();
      setPopupDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handlePopupDrag = (e: MouseEvent) => {
    if (isPopupDragging) {
      const newX = e.clientX - popupDragOffset.x;
      const newY = e.clientY - popupDragOffset.y;
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const popupWidth = popupRef.current?.offsetWidth || 400;
      const popupHeight = popupRef.current?.offsetHeight || 300;
      
      const boundedX = Math.max(0, Math.min(newX, windowWidth - popupWidth));
      const boundedY = Math.max(0, Math.min(newY, windowHeight - popupHeight));
      
      setPopupPosition({ x: boundedX, y: boundedY });
    }
  };

  const handlePopupDragEnd = () => {
    setIsPopupDragging(false);
  };

  useEffect(() => {
    if (isPopupDragging) {
      document.addEventListener('mousemove', handlePopupDrag);
      document.addEventListener('mouseup', handlePopupDragEnd);
      return () => {
        document.removeEventListener('mousemove', handlePopupDrag);
        document.removeEventListener('mouseup', handlePopupDragEnd);
      };
    }
  }, [isPopupDragging, popupDragOffset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close popup if clicked outside and not dragging
      if (showPopup && popupRef.current && !popupRef.current.contains(event.target as Node) && !isPopupDragging) {
        setShowPopup(false);
        setAiResult(null);
        setTranslateResult(null);
        setSavedSelection(null); // Clear saved selection when popup is closed by clicking outside
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup, isPopupDragging]);

  const renderReadingContent = () => {
    if (!selectedPassage?.content) return null;
    return (
      <div 
        className="prose prose-invert max-w-none select-text"
        style={{ fontSize: `${readingFontSize}px`, lineHeight: 1.6, userSelect: 'text', cursor: 'text' }}
        onMouseUp={handleTextSelection}
        onDoubleClick={handleTextSelection}
      >
        <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
          {selectedPassage.content}
        </div>
      </div>
    );
  };

  const renderQuestionPanel = () => {
    console.log('renderQuestionPanel called, questionGroups:', questionGroups);
    console.log('questionGroups.length:', questionGroups.length);
    
    // Debug log for each question group and their questions
    questionGroups.forEach((group, groupIndex) => {
      console.log(`Group ${groupIndex}:`, {
        id: group.id,
        question_type: group.question_type,
        questions_count: group.questions?.length || 0
      });
      
      group.questions?.forEach((question, qIndex) => {
        console.log(`  Question ${qIndex}:`, {
          id: question.id,
          question_type: question.question_type,
          options: question.options,
          options_type: typeof question.options,
          options_length: Array.isArray(question.options) ? question.options.length : 'not array'
        });
      });
    });
    
    // Debug multiple_choice_5 questions
    questionGroups.forEach(group => {
      group.questions.forEach(question => {
        if (question.question_type === 'multiple_choice_5') {
          console.log('DEBUG multiple_choice_5 question:', {
            id: question.id,
            question_type: question.question_type,
            options: question.options,
            optionsType: typeof question.options,
            optionsLength: question.options ? question.options.length : 'null'
          });
        }
      });
    });
    
    if (!questionGroups.length) {
      console.log('No question groups found, returning null');
      return (
        <div className="text-gray-300 p-4">
          <p>Không có câu hỏi nào được tải. Debug info:</p>
          <p>questionGroups length: {questionGroups.length}</p>
          <p>isTestActive: {isTestActive.toString()}</p>
          <p>selectedPassage: {selectedPassage ? selectedPassage.title : 'null'}</p>
        </div>
      );
    }

    return (
      <div 
        onMouseUp={handleTextSelection}
        onDoubleClick={handleTextSelection}
        style={{ userSelect: 'text', cursor: 'text' }}
      >
        {questionGroups.map((group) => (
          <div key={group.id} className="mb-8 bg-gray-600 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-50 mb-2">
            Questions {group.questions[0]?.order_index} - {group.questions[group.questions.length - 1]?.order_index}
          </h3>
          <p className="text-gray-300 mb-3">{group.instructions}</p>
          
          {/* Guide button */}
          <button
            onClick={() => setOpenGuides(prev => ({...prev, [group.id]: !prev[group.id]}))}
            className="text-sm text-blue-400 hover:text-blue-300 mb-3"
          >
            {openGuides[group.id] ? 'Ẩn hướng dẫn' : 'Hướng dẫn'}
          </button>
          {openGuides[group.id] && (
            <div className="bg-gray-700 p-3 rounded mb-3 text-sm text-gray-300">
              {highlightGuideText(group.guide || group.explanation || group.questions[0]?.guide || '')}
            </div>
          )}
        </div>

        {/* Render questions based on type */}
        {group.question_type === 'note_completion' && (
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6 space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h4 className="text-lg font-semibold text-blue-300">Hoàn thành ghi chú</h4>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-600/50">
              <div className="text-sm text-blue-300 mb-3 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Điền vào chỗ trống với từ/cụm từ phù hợp từ bài đọc (tối đa 2-3 từ)
              </div>
              
              {typeof group.content === 'string' ? (
                <div className="text-gray-100 leading-loose text-base" style={{ fontSize: `${questionFontSize}px`, lineHeight: '2' }}>
                  {group.content.split(/(_+|\[\d+\]|\{\{?\d+\}?\}|\(\d+\))/).map((part, index) => {
                    // Check if this part is a blank pattern
                    const blankMatch = part.match(/^(_+|\[(\d+)\]|\{\{?(\d+)\}?\}|\((\d+)\))$/);
                    if (blankMatch) {
                      // Extract question number from different patterns
                      const questionNum = blankMatch[2] || blankMatch[3] || blankMatch[4] || (index + 1);
                      const questionId = parseInt(questionNum.toString());
                      const question = group.questions.find(q => q.order_index === questionId);
                      const inputValue = userAnswers[question?.id || 0] || '';
                      const inputWidth = Math.max(60, inputValue.length * 12 + 20); // Dynamic width based on content
                      
                      return (
                        <span key={index} className="inline-block mx-1 relative">
                          <input
                            type="text"
                            className="bg-transparent border-none outline-none text-white font-medium text-center border-b-2 border-blue-400 focus:border-blue-300 transition-all duration-200 pb-1"
                            value={inputValue}
                            onChange={(e) => question && handleAnswer(question.id, e.target.value)}
                            placeholder={`${questionId}`}
                            style={{ 
                              fontSize: `${questionFontSize}px`,
                              width: `${inputWidth}px`,
                              minWidth: '60px'
                            }}
                          />
                        </span>
                      );
                    }
                    return <span key={index} className="text-gray-100">{part}</span>;
                  })}
                </div>
              ) : (
                <div className="text-gray-100 leading-loose text-base" style={{ fontSize: `${questionFontSize}px`, lineHeight: '2' }}>
                  {group.content?.map((item: any, index: number) => {
                    if (item.type === 'text') {
                      return <span key={index} className="text-gray-100">{item.value}</span>;
                    } else if (item.type === 'blank') {
                      const question = group.questions.find(q => q.order_index === item.questionId);
                      const inputValue = userAnswers[question?.id || 0] || '';
                      const inputWidth = Math.max(60, inputValue.length * 12 + 20); // Dynamic width based on content
                      
                      return (
                        <span key={index} className="inline-block mx-1 relative">
                          <input
                            type="text"
                            className="bg-transparent border-none outline-none text-white font-medium text-center border-b-2 border-blue-400 focus:border-blue-300 transition-all duration-200 pb-1"
                            value={inputValue}
                            onChange={(e) => question && handleAnswer(question.id, e.target.value)}
                            placeholder={`${item.questionId}`}
                            style={{ 
                              fontSize: `${questionFontSize}px`,
                              width: `${inputWidth}px`,
                              minWidth: '60px'
                            }}
                          />
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary completion - similar to note completion */}
        {group.question_type === 'summary_completion' && (
          <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border border-green-500/30 rounded-xl p-6 space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-green-400" />
              <h4 className="text-lg font-semibold text-green-300">Hoàn thành tóm tắt</h4>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-600/50">
              <div className="text-sm text-green-300 mb-3 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Điền vào chỗ trống với từ/cụm từ phù hợp từ bài đọc hoặc chọn từ danh sách
              </div>
              
              {/* Render content segments for summary completion */}
              {group.contentSegments ? (
                <div className="text-gray-100 leading-loose text-base" style={{ fontSize: `${questionFontSize}px`, lineHeight: '2' }}>
                  {group.contentSegments.map((segment: any, index: number) => {
                    if (segment.type === 'text') {
                      return <span key={index} className="text-gray-100">{segment.value}</span>;
                    } else if (segment.type === 'blank') {
                      const question = group.questions.find(q => q.order_index === segment.questionId);
                      const inputValue = userAnswers[question?.id || 0] || '';
                      const inputWidth = Math.max(60, inputValue.length * 12 + 20);
                      
                      return (
                        <span key={index} className="inline-block mx-1 relative">
                          <input
                            type="text"
                            className="bg-transparent border-none outline-none text-white font-medium text-center border-b-2 border-green-400 focus:border-green-300 transition-all duration-200 pb-1"
                            value={inputValue}
                            onChange={(e) => question && handleAnswer(question.id, e.target.value)}
                            placeholder={`${segment.questionId}`}
                            style={{ 
                              fontSize: `${questionFontSize}px`,
                              width: `${inputWidth}px`,
                              minWidth: '60px'
                            }}
                          />
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="text-gray-100 leading-loose text-base" style={{ fontSize: `${questionFontSize}px`, lineHeight: '2' }}>
                  {typeof group.content === 'string' ? (
                    group.content.split(/(_+|\[\d+\]|\{\{?\d+\}?\}|\(\d+\))/).map((part, index) => {
                      const blankMatch = part.match(/^(_+|\[(\d+)\]|\{\{?(\d+)\}?\}|\((\d+)\))$/);
                      if (blankMatch) {
                        const questionNum = blankMatch[2] || blankMatch[3] || blankMatch[4] || (index + 1);
                        const questionId = parseInt(questionNum.toString());
                        const question = group.questions.find(q => q.order_index === questionId);
                        const inputValue = userAnswers[question?.id || 0] || '';
                        const inputWidth = Math.max(60, inputValue.length * 12 + 20);
                        
                        return (
                          <span key={index} className="inline-block mx-1 relative">
                            <input
                              type="text"
                              className="bg-transparent border-none outline-none text-white font-medium text-center border-b-2 border-green-400 focus:border-green-300 transition-all duration-200 pb-1"
                              value={inputValue}
                              onChange={(e) => question && handleAnswer(question.id, e.target.value)}
                              placeholder={`${questionId}`}
                              style={{ 
                                fontSize: `${questionFontSize}px`,
                                width: `${inputWidth}px`,
                                minWidth: '60px'
                              }}
                            />
                          </span>
                        );
                      }
                      return <span key={index} className="text-gray-100">{part}</span>;
                    })
                  ) : (
                    group.content?.map((item: any, index: number) => {
                      if (item.type === 'text') {
                        return <span key={index} className="text-gray-100">{item.value}</span>;
                      } else if (item.type === 'blank') {
                        const question = group.questions.find(q => q.order_index === item.questionId);
                        const inputValue = userAnswers[question?.id || 0] || '';
                        const inputWidth = Math.max(60, inputValue.length * 12 + 20);
                        
                        return (
                          <span key={index} className="inline-block mx-1 relative">
                            <input
                              type="text"
                              className="bg-transparent border-none outline-none text-white font-medium text-center border-b-2 border-green-400 focus:border-green-300 transition-all duration-200 pb-1"
                              value={inputValue}
                              onChange={(e) => question && handleAnswer(question.id, e.target.value)}
                              placeholder={`${item.questionId}`}
                              style={{ 
                                fontSize: `${questionFontSize}px`,
                                width: `${inputWidth}px`,
                                minWidth: '60px'
                              }}
                            />
                          </span>
                        );
                      }
                      return null;
                    })
                  )}
                </div>
              )}
              
              {/* Show options if available for summary completion */}
              {group.options && (
                <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
                  <h5 className="text-sm font-semibold text-green-300 mb-3">Danh sách từ:</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {group.options.map((option: any, index: number) => (
                      <div key={index} className="text-gray-300">
                        <span className="font-medium text-green-400">{option.key}.</span> {option.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Choose two letters - Group handling */}
        {group.question_type === 'choose_two_letters' && (
          <div className="space-y-4">
            <div className="border-l-4 border-primary-500 pl-4">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-green-300 mb-2">{group.instructions}</h4>
                {group.groupName && (
                  <p className="text-gray-300 mb-3">{group.groupName}</p>
                )}
                {/* Hiển thị danh sách câu hỏi */}
                <div className="text-sm text-gray-400 mb-3">
                  {group.questions.map((question, qIndex) => (
                    <div key={question.id} className="mb-1">
                      {question.order_index}. {question.question_text || question.content}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Show options for the group */}
              {group.options && (
                <div className="mb-6">
                  <div className="text-sm text-yellow-400 mb-3">Chọn 2 đáp án từ các lựa chọn sau:</div>
                  <div className="space-y-2">
                    {group.options.map((option: any, optionIndex: number) => {
                      const optionText = typeof option === 'string' ? option : (option.value || option);
                      const optionKey = typeof option === 'object' && option.key ? option.key : String.fromCharCode(65 + optionIndex);
                      
                      // Get all selected answers for this group as a single array
                      const groupAnswerKey = `group_${group.id}`;
                      const selectedAnswers = userAnswers[groupAnswerKey] ? 
                        (Array.isArray(userAnswers[groupAnswerKey]) ? userAnswers[groupAnswerKey] : userAnswers[groupAnswerKey].toString().split(',').filter(Boolean)) : [];
                      
                      const isSelected = selectedAnswers.includes(optionKey);
                      const canSelect = selectedAnswers.length < 2 || isSelected;
                      
                      return (
                        <label key={optionIndex} className="flex items-center space-x-2 text-gray-300">
                          <input
                            type="checkbox"
                            value={optionKey}
                            checked={isSelected}
                            onChange={(e) => {
                              let newSelectedAnswers = [...selectedAnswers];
                              if (e.target.checked && selectedAnswers.length < 2) {
                                newSelectedAnswers.push(optionKey);
                              } else if (!e.target.checked) {
                                newSelectedAnswers = newSelectedAnswers.filter(a => a !== optionKey);
                              }
                              
                              // Update group answer
                              handleAnswer(groupAnswerKey, newSelectedAnswers);
                              
                              // Also update individual questions for compatibility
                              group.questions.forEach((q: any, index: number) => {
                                if (index < newSelectedAnswers.length) {
                                  handleAnswer(q.id, newSelectedAnswers[index]);
                                } else {
                                  handleAnswer(q.id, '');
                                }
                              });
                            }}
                            className="text-primary-500"
                            disabled={!canSelect}
                          />
                          <span className={!canSelect ? 'opacity-50' : ''}>
                            {optionKey}. {optionText}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Hiển thị đáp án đã chọn */}
              <div className="mt-4 p-3 bg-gray-700/30 rounded">
                <div className="text-sm text-gray-400 mb-2">Đáp án đã chọn:</div>
                <div className="font-medium text-green-400">
                  {(() => {
                    const groupAnswerKey = `group_${group.id}`;
                    const selectedAnswers = userAnswers[groupAnswerKey] ? 
                      (Array.isArray(userAnswers[groupAnswerKey]) ? userAnswers[groupAnswerKey] : userAnswers[groupAnswerKey].toString().split(',').filter(Boolean)) : [];
                    return selectedAnswers.length > 0 ? selectedAnswers.join(', ') : 'Chưa chọn đáp án';
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other question types */}
        {group.question_type !== 'note_completion' && group.question_type !== 'summary_completion' && group.question_type !== 'choose_two_letters' && (
          <div className="space-y-4">
            {group.questions.map((question) => (
              <div key={question.id} className="border-l-4 border-primary-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-200 font-medium">
                    {question.order_index}. {question.question_text || question.content}
                  </p>
                  <button
                    onClick={() => setOpenGuides(prev => ({...prev, [question.id]: !prev[question.id]}))}
                    className="text-sm text-blue-400 hover:text-blue-300 ml-2"
                  >
                    {openGuides[question.id] ? 'Ẩn hướng dẫn' : 'Hướng dẫn'}
                  </button>
                </div>
                {openGuides[question.id] && (
                  <div className="bg-gray-700 p-3 rounded mb-3 text-sm text-gray-300">
                    {highlightGuideText(question.guide || question.explanation || '')}
                  </div>
                )}
                
                {/* Debug log for this specific question */}
                {console.log(`Rendering question ${question.id}:`, {
                  question_type: question.question_type,
                  group_question_type: group.question_type,
                  has_options: !!question.options,
                  options: question.options,
                  options_type: typeof question.options,
                  is_array: Array.isArray(question.options),
                  options_length: question.options ? question.options.length : 'null',
                  condition_check: (question.question_type === 'multiple_choice' || question.question_type === 'multiple_choice_5' || question.question_type === 'multiple_choice_group' || group.question_type === 'multiple_choice_single') && question.options && Array.isArray(question.options) && question.options.length > 0
                })}
                
                {/* Special debug for multiple_choice_5 */}
                {question.question_type === 'multiple_choice_5' && console.log('MULTIPLE_CHOICE_5 SPECIFIC DEBUG:', {
                  id: question.id,
                  question_text: question.question_text,
                  options_raw: question.options,
                  options_parsed: typeof question.options === 'string' ? 'STRING - NEEDS PARSING' : 'ALREADY PARSED',
                  will_render: !!(question.options && Array.isArray(question.options) && question.options.length > 0)
                })}
                
                {/* Render answer options based on question type */}
                {(question.question_type === 'multiple_choice' || question.question_type === 'multiple_choice_5' || question.question_type === 'multiple_choice_group' || group.question_type === 'multiple_choice_single') && question.options && Array.isArray(question.options) && question.options.length > 0 && (
                  <div className="space-y-2">
                    {question.question_type === 'multiple_choice_5' || question.question_type === 'multiple_choice_group' ? (
                      // Multiple choice with multiple answers (checkbox)
                      <div>
                        <div className="text-sm text-yellow-400 mb-2">
                          {question.question_type === 'multiple_choice_5' ? 'Chọn 2 đáp án:' : 'Chọn nhiều đáp án:'}
                        </div>
                        {question.options.map((option: any, optionIndex: number) => {
                          const optionText = typeof option === 'string' ? option : 
                            (typeof option === 'object' && option !== null && option.value ? option.value : 
                             typeof option === 'object' && option !== null ? JSON.stringify(option) : String(option));
                          const optionKey = typeof option === 'object' && option !== null && option.key ? option.key : String.fromCharCode(65 + optionIndex);
                          const currentAnswers = userAnswers[question.id] ? userAnswers[question.id].toString().split(',') : [];
                          const maxAnswers = question.question_type === 'multiple_choice_5' ? 2 : 3;
                          
                          return (
                            <label key={optionIndex} className="flex items-center space-x-2 text-gray-300">
                              <input
                                type="checkbox"
                                name={`question_${question.id}`}
                                value={optionKey}
                                checked={currentAnswers.includes(optionKey)}
                                onChange={(e) => {
                                  let newAnswers = [...currentAnswers];
                                  if (e.target.checked) {
                                    if (newAnswers.length < maxAnswers) {
                                      newAnswers.push(optionKey);
                                    }
                                  } else {
                                    newAnswers = newAnswers.filter(a => a !== optionKey);
                                  }
                                  handleAnswer(question.id, newAnswers.join(','));
                                }}
                                className="text-primary-500"
                                disabled={!currentAnswers.includes(optionKey) && currentAnswers.length >= maxAnswers}
                              />
                              <span className={currentAnswers.length >= maxAnswers && !currentAnswers.includes(optionKey) ? 'opacity-50' : ''}>
                                {optionKey}. {optionText}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      // Single choice (radio)
                      question.options.map((option: any, optionIndex: number) => {
                        const optionText = typeof option === 'string' ? option : 
                          (typeof option === 'object' && option !== null && option.value ? option.value : 
                           typeof option === 'object' && option !== null ? JSON.stringify(option) : String(option));
                        const optionKey = typeof option === 'object' && option !== null && option.key ? option.key : String.fromCharCode(65 + optionIndex);
                        
                        return (
                          <label key={optionIndex} className="flex items-center space-x-2 text-gray-300">
                            <input
                              type="radio"
                              name={`question_${question.id}`}
                              value={optionKey}
                              checked={userAnswers[question.id] === optionKey}
                              onChange={(e) => handleAnswer(question.id, e.target.value)}
                              className="text-primary-500"
                            />
                            <span>{optionKey}. {optionText}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}

                {(question.question_type === 'true_false_not_given' || question.question_type === 'yes_no_not_given') && (
                  <div className="space-y-2">
                    {(question.question_type === 'true_false_not_given' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']).map((option) => (
                      <label key={option} className="flex items-center space-x-2 text-gray-300">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          value={option}
                          checked={userAnswers[question.id] === option}
                          onChange={(e) => handleAnswer(question.id, e.target.value)}
                          className="text-primary-500"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {(question.question_type === 'sentence_completion' || question.question_type === 'short_answer_questions') && (
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded text-white"
                    value={userAnswers[question.id] || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    placeholder="Nhập câu trả lời..."
                  />
                )}

                {/* Matching phrases */}
                {(question.question_type === 'matching_phrases' || group.question_type === 'matching_phrases') && (
                  <div className="space-y-3">
                    {/* Display question content */}
                    <div className="bg-gray-700/30 p-3 rounded text-gray-200">
                      {question.content || question.question_text}
                    </div>
                    
                    {/* Dropdown for answer selection */}
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-400 min-w-[80px]">Chọn đáp án:</span>
                      <select
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-green-400 focus:outline-none"
                        value={userAnswers[question.id] || ''}
                        onChange={(e) => handleAnswer(question.id, e.target.value)}
                      >
                        <option value="">-- Chọn đáp án --</option>
                        {/* Use group options if available, otherwise question options */}
                        {(group.options || question.options || []).map((option: any, optionIndex: number) => {
                          const optionText = typeof option === 'string' ? option : 
                            (typeof option === 'object' && option !== null && option.value ? option.value : 
                             typeof option === 'object' && option !== null ? JSON.stringify(option) : String(option));
                          const optionKey = typeof option === 'object' && option !== null && option.key ? option.key : String.fromCharCode(65 + optionIndex);
                          
                          return (
                            <option key={optionIndex} value={optionKey}>
                              {optionKey}. {optionText}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    {/* Show selected answer */}
                    {userAnswers[question.id] && (
                      <div className="text-sm text-green-400">
                        Đã chọn: {userAnswers[question.id]}
                      </div>
                    )}
                  </div>
                )}

                {/* Choose two letters */}
                {(question.question_type === 'choose_two_letters' || group.question_type === 'choose_two_letters') && (
                  <div className="space-y-2">
                    {/* Debug log for choose_two_letters */}
                    {console.log(`choose_two_letters debug for question ${question.id}:`, {
                      question_options: question.options,
                      group_options: group.options,
                      question_type: question.question_type,
                      group_type: group.question_type
                    })}
                    
                    {(question.options && Array.isArray(question.options) && question.options.length > 0) || (group.options && Array.isArray(group.options) && group.options.length > 0) ? (
                      <div>
                        <div className="text-sm text-yellow-400 mb-2">Chọn 2 đáp án:</div>
                        {(question.options || group.options || []).map((option: any, optionIndex: number) => {
                          const optionText = typeof option === 'string' ? option : 
                            (typeof option === 'object' && option !== null && option.value ? option.value : 
                             typeof option === 'object' && option !== null ? JSON.stringify(option) : String(option));
                          const optionKey = typeof option === 'object' && option !== null && option.key ? option.key : String.fromCharCode(65 + optionIndex);
                          const currentAnswers = userAnswers[question.id] ? userAnswers[question.id].toString().split(',') : [];
                          
                          return (
                            <label key={optionIndex} className="flex items-center space-x-2 text-gray-300">
                              <input
                                type="checkbox"
                                name={`question_${question.id}`}
                                value={optionKey}
                                checked={currentAnswers.includes(optionKey)}
                                onChange={(e) => {
                                  let newAnswers = [...currentAnswers];
                                  if (e.target.checked) {
                                    if (newAnswers.length < 2) {
                                      newAnswers.push(optionKey);
                                    }
                                  } else {
                                    newAnswers = newAnswers.filter(a => a !== optionKey);
                                  }
                                  handleAnswer(question.id, newAnswers.join(','));
                                }}
                                className="text-primary-500"
                                disabled={!currentAnswers.includes(optionKey) && currentAnswers.length >= 2}
                              />
                              <span className={currentAnswers.length >= 2 && !currentAnswers.includes(optionKey) ? 'opacity-50' : ''}>
                                {optionKey}. {optionText}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        value={userAnswers[question.id] || ''}
                        onChange={(e) => handleAnswer(question.id, e.target.value)}
                        placeholder="Nhập 2 chữ cái (ví dụ: A,B)..."
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        ))}
      </div>
    );
  };

  // Load passages on component mount
  useEffect(() => {
    const fetchPassages = async () => {
      try {
        const response = await fetch('/api/ielts-reading/passages');
        const data = await response.json();
        setPassages(data.passages || []);
      } catch (error) {
        console.error('Error fetching passages:', error);
        setPassages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPassages();
  }, []);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTestActive && isTimerEnabled && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - finish test automatically
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTestActive, isTimerEnabled, timeLeft]);

  // Timer modal component
  const timerModal = showTimerModal && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-600/50 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Chọn chế độ làm bài</h3>
          <p className="text-gray-400">Bạn có muốn bật tính giờ cho bài thi này không?</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              console.log('Enabling timer, questionGroups:', questionGroups);
              setIsTimerEnabled(true);
              setShowTimerModal(false);
              if (pendingPassage) {
                console.log('Setting selected passage:', pendingPassage);
                console.log('Setting question groups from pending:', pendingQuestionGroups);
                setSelectedPassage(pendingPassage);
                setQuestionGroups(pendingQuestionGroups);
                setIsTestActive(true);
                setTimeLeft(pendingPassage.time_limit * 60);
                setPendingPassage(null);
              }
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Có, bật tính giờ</span>
          </button>
          
          <button
            onClick={() => {
              console.log('Free mode, questionGroups:', questionGroups);
              setIsTimerEnabled(false);
              setShowTimerModal(false);
              if (pendingPassage) {
                console.log('Setting selected passage:', pendingPassage);
                console.log('Setting question groups from pending:', pendingQuestionGroups);
                setSelectedPassage(pendingPassage);
                setQuestionGroups(pendingQuestionGroups);
                setIsTestActive(true);
                setPendingPassage(null);
              }
            }}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Không, làm bài tự do</span>
          </button>
          
          <button
            onClick={() => setShowTimerModal(false)}
            className="w-full text-gray-400 hover:text-white py-2 transition-colors duration-200"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );

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
            <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-600/30">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">{selectedPassage.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <span>Cấp độ: {selectedPassage.level}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      <span>{selectedPassage.question_count} câu hỏi</span>
                    </span>
                  </div>
                </div>
                <div className="flex space-x-4 items-center">
                  {/* Font size controls */}
                  <div className="flex items-center space-x-3 px-4 py-2 bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-600/30">
                    <span className="text-sm text-gray-300 font-medium">Bài đọc:</span>
                    <button 
                      onClick={() => adjustFontSize('reading', false)} 
                      className="w-8 h-8 flex items-center justify-center text-gray-200 hover:text-blue-400 bg-gray-600/50 hover:bg-gray-600 rounded-md transition-all duration-200"
                      disabled={readingFontSize <= 12}
                    >
                      <span className="text-lg font-bold">-</span>
                    </button>
                    <span className="text-sm text-blue-400 font-semibold min-w-[40px] text-center">{readingFontSize}px</span>
                    <button 
                      onClick={() => adjustFontSize('reading', true)} 
                      className="w-8 h-8 flex items-center justify-center text-gray-200 hover:text-blue-400 bg-gray-600/50 hover:bg-gray-600 rounded-md transition-all duration-200"
                      disabled={readingFontSize >= 24}
                    >
                      <span className="text-lg font-bold">+</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-3 px-4 py-2 bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-600/30">
                    <span className="text-sm text-gray-300 font-medium">Câu hỏi:</span>
                    <button 
                      onClick={() => adjustFontSize('question', false)} 
                      className="w-8 h-8 flex items-center justify-center text-gray-200 hover:text-purple-400 bg-gray-600/50 hover:bg-gray-600 rounded-md transition-all duration-200"
                      disabled={questionFontSize <= 12}
                    >
                      <span className="text-lg font-bold">-</span>
                    </button>
                    <span className="text-sm text-purple-400 font-semibold min-w-[40px] text-center">{questionFontSize}px</span>
                    <button
                      onClick={() => adjustFontSize('question', true)} 
                      className="w-8 h-8 flex items-center justify-center text-gray-200 hover:text-purple-400 bg-gray-600/50 hover:bg-gray-600 rounded-md transition-all duration-200"
                      disabled={questionFontSize >= 24}
                    >
                      <span className="text-lg font-bold">+</span>
                    </button>
                  </div>
                
                  <button
                    onClick={toggleFullScreen} 
                    className="p-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded-lg border border-gray-500/30 transition-all duration-200 hover:scale-105"
                    title={isFullScreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                  >
                    {isFullScreen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                    )}
                  </button>
                  {isTimerEnabled && timeLeft > 0 && (
                    <div className="text-right bg-gray-700/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-600/30">
                      <div className="text-sm text-gray-400 mb-1">Thời gian còn lại</div>
                      <div className="text-xl font-bold text-red-400">
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={finishTest}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    Kết thúc bài thi
                  </button>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div ref={containerRef} className="flex-grow flex flex-row bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-600/30" style={{height: 'calc(100vh - 140px)'}}>
              {/* Reading Passage */}
              <div 
                className="p-6 flex-1 min-w-0"
                style={{ 
                  width: `${readingPanelWidth}%`, 
                  maxWidth: `${readingPanelWidth}%`,
                  overflow: 'auto',
                  scrollbarWidth: 'none', /* Firefox */
                  msOverflowStyle: 'none', /* IE and Edge */
                }}
              >
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-50">Bài đọc</h2>
                </div>
                <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30">
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
                className="w-1 bg-gradient-to-b from-gray-600 to-gray-700 hover:from-blue-500 hover:to-purple-500 cursor-col-resize transition-all duration-200 relative"
                style={{ zIndex: 10 }}
                onMouseDown={() => setIsDragging(true)}
              >
                <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
                  <div className="w-1 h-8 bg-gray-500 rounded-full opacity-50"></div>
                </div>
              </div>
              
              {/* Questions */}
              <div 
                className="p-6 flex-1 min-w-0 select-text"
                style={{ 
                  width: `${100 - readingPanelWidth}%`, 
                  maxWidth: `${100 - readingPanelWidth}%`, 
                  fontSize: `${questionFontSize}px`, 
                  lineHeight: 1.6,
                  overflow: 'auto',
                  scrollbarWidth: 'none', /* Firefox */
                  msOverflowStyle: 'none', /* IE and Edge */
                }}
                ref={questionPanelRef}
              >
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-50">Câu hỏi</h2>
                </div>
                <div style={{ fontSize: `${questionFontSize}px`, lineHeight: 1.6 }}>
                  <style>{`
                    .ielts-question-panel * {
                      font-size: ${questionFontSize}px !important;
                    }
                    /* Hide scrollbars for WebKit browsers */
                    .p-6::-webkit-scrollbar {
                      display: none;
                    }
                    .overflow-auto::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  <div className="ielts-question-panel">
                    {renderQuestionPanel()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Text Selection Popup */}
            {showPopup && (
              <div 
                ref={popupRef}
                className="fixed bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 rounded-xl shadow-2xl z-50 backdrop-blur-sm"
                style={{ 
                  left: popupPosition.x, 
                  top: popupPosition.y,
                  cursor: isPopupDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handlePopupDragStart}
              >
                {/* Main popup content */}
                {!aiResult && !translateResult && (
                  <>
                    {/* Action buttons */}
                    <div className="flex items-center p-3 space-x-2">
                      {isHighlightedText ? (
                        /* Remove Highlight Button */
                        <button 
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-1"
                          onClick={removeHighlight}
                        >
                          <X className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-gray-300">Bỏ tô sáng</span>
                        </button>
                      ) : (
                        <>
                          {/* Highlight Button */}
                          <div className="relative group">
                            <button className="p-2 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-1">
                              <Palette className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs text-gray-300">Tô sáng</span>
                            </button>
                            <div className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
                              <div className="flex space-x-1" onMouseLeave={(e) => e.stopPropagation()}>
                                {highlightColors.map((color, index) => (
                                  <button
                                    key={index}
                                    className="w-6 h-6 rounded border-2 border-gray-500 hover:border-white transition-colors pointer-events-auto"
                                    style={{ backgroundColor: color }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleHighlight(color);
                                    }}
                                  />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* AI Lookup Button */}
                      <button 
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-1"
                        onClick={handleAILookup}
                        disabled={isLoadingAI}
                      >
                        <BookOpen className={`w-4 h-4 ${isLoadingAI ? 'text-gray-400' : 'text-blue-400'}`} />
                        <span className="text-xs text-gray-300">Hỏi AI</span>
                      </button>

                      {/* Translate Button */}
                      <button 
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-1"
                        onClick={handleTranslate}
                        disabled={isLoadingTranslate}
                      >
                        <Languages className={`w-4 h-4 ${isLoadingTranslate ? 'text-gray-400' : 'text-green-400'}`} />
                        <span className="text-xs text-gray-300">Dịch</span>
                      </button>
                    </>
                  )}
                </div>


              </>
            )}

            {/* AI Result */}
            {aiResult && (
              <div className="border-t border-gray-600/50 p-4 max-w-sm">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <h4 className="text-white font-semibold">Thông tin từ vựng</h4>
                  </div>
                  
                  {/* Nghĩa - làm to và đặt đầu tiên */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-4 border border-blue-500/30">
                    <p className="text-gray-300 text-sm mb-2"><strong>Nghĩa:</strong></p>
                    <p className="text-white font-bold text-lg leading-relaxed">{aiResult.meaning}</p>
                  </div>
                  
                  {/* Ví dụ - đặt thứ hai */}
                  {aiResult.example && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-gray-300 text-sm mb-2"><strong>Ví dụ:</strong></p>
                      <p className="text-gray-200 italic text-base">{aiResult.example}</p>
                    </div>
                  )}
                  
                  {/* Loại từ - đặt cuối cùng và chuyển sang tiếng Anh */}
                  {aiResult.type && aiResult.type !== 'N/A' && (
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-gray-300 text-sm mb-1"><strong>Type:</strong></p>
                      <p className="text-blue-400 font-medium">{aiResult.type}</p>
                    </div>
                  )}
                  
                  <button 
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105"
                    onClick={handleSaveVocab}
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu vào từ điển</span>
                  </button>
                </div>
              </div>
            )}

            {/* Translate Result */}
            {translateResult && (
              <div className="border-t border-gray-600/50 p-4 max-w-sm">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <Languages className="w-4 h-4 text-green-400" />
                    <h4 className="text-white font-semibold">Bản dịch</h4>
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-gray-300 text-sm mb-1"><strong>Tiếng Anh:</strong></p>
                    <p className="text-gray-200">{selectedText}</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg p-4 border border-green-500/30">
                    <p className="text-gray-300 text-sm mb-2"><strong>Tiếng Việt:</strong></p>
                    <p className="text-white font-medium text-base leading-relaxed">{translateResult.translatedText}</p>
                  </div>
                  
                  <button 
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105"
                    onClick={handleSaveVocab}
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu vào từ điển</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </>
);
}

// Passage selection screen
return (
  <Layout hideNavbar={hideNavbar}>
    {timerModal}
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            IELTS Reading Practice
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Luyện tập kỹ năng đọc hiểu IELTS với các bài thi thực tế và hệ thống chấm điểm tự động
          </p>
        </div>
        
        {passages.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 border border-gray-700/50 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Chưa có bài đọc</h3>
              <p className="text-gray-500">Hiện tại chưa có bài đọc nào được tạo. Vui lòng quay lại sau.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {passages.map((passage) => {
              const levelColors = {
                beginner: 'from-green-500 to-emerald-600',
                intermediate: 'from-yellow-500 to-orange-600', 
                advanced: 'from-red-500 to-pink-600'
              };
              const levelBadgeColors = {
                beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
                intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                advanced: 'bg-red-500/20 text-red-400 border-red-500/30'
              };
              return (
                <div key={passage.id} className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-50 group-hover:text-white transition-colors duration-300 line-clamp-2">{passage.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${levelBadgeColors[passage.level]} capitalize`}>
                        {passage.level}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                       <div className="flex items-center space-x-4 text-sm text-gray-400">
                         <span className="flex items-center space-x-1">
                           <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                           <span>{passage.question_count} câu hỏi</span>
                         </span>
                         <span className="flex items-center space-x-1">
                           <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                           <span>{passage.time_limit} phút</span>
                         </span>
                       </div>
                       
                       <div className="flex items-center space-x-2">
                         <span className="text-sm text-gray-400">Danh mục:</span>
                         <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">{passage.category}</span>
                       </div>
                     </div>
                     
                     <button
                       onClick={async () => {
                         try {
                           const response = await fetch(`/api/ielts-reading/questions/${passage.id}`);
                           const data = await response.json();
                           console.log('Fetched question groups:', data.questionGroups);
                           
                           // Process question groups to ensure options are arrays
                           const processedGroups = data.questionGroups?.map((group: any) => ({
                             ...group,
                             questions: group.questions?.map((question: any) => {
                               let processedOptions = question.options;
                               
                               // If options is a string, try to parse it as JSON
                               if (typeof question.options === 'string') {
                                 try {
                                   processedOptions = JSON.parse(question.options);
                                   console.log(`Parsed options for question ${question.id}:`, processedOptions);
                                 } catch (e) {
                                   console.log(`Failed to parse options for question ${question.id}, treating as single option:`, question.options);
                                   processedOptions = [question.options];
                                 }
                               }
                               
                               // Ensure options is an array
                               if (!Array.isArray(processedOptions)) {
                                 processedOptions = processedOptions ? [processedOptions] : [];
                               }
                               
                               // Debug multiple_choice_5 data after processing
                               if (question.question_type === 'multiple_choice_5') {
                                 console.log('PROCESSED multiple_choice_5:', {
                                   id: question.id,
                                   question_type: question.question_type,
                                   originalOptions: question.options,
                                   processedOptions: processedOptions,
                                   optionsType: typeof processedOptions,
                                   optionsIsArray: Array.isArray(processedOptions),
                                   optionsLength: processedOptions ? processedOptions.length : 'null'
                                 });
                               }
                               
                               return {
                                 ...question,
                                 options: processedOptions
                               };
                             }) || []
                           })) || [];
                           
                           console.log('Processed question groups:', processedGroups);
                           setPendingPassage(passage);
                           setPendingQuestionGroups(processedGroups);
                           setShowTimerModal(true);
                         } catch (error) {
                           console.error('Error fetching questions:', error);
                           alert('Có lỗi xảy ra khi tải câu hỏi');
                         }
                       }}
                       className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                     >
                       <BookOpen className="w-5 h-5" />
                       <span>Bắt đầu làm bài</span>
                     </button>
                   </div>
                 </div>
               );
             })}
           </div>
         )}
       </div>
     </div>
   </Layout>
 );
};

// Custom getLayout để bypass Layout global khi đang làm bài
IeltsReadingPage.getLayout = function getLayout(page: React.ReactElement) {
  return page; // Không wrap với Layout, component tự quản lý
};

export default IeltsReadingPage;