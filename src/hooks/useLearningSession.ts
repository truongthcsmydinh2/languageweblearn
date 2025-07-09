import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Term, LearningItem, normalizeForComparison } from '@/utils/learningUtils';

// Định nghĩa các trạng thái của phiên học
export enum SessionState {
  LOADING = 'loading',
  READY = 'ready',
  LEARNING = 'learning',
  REVIEWING = 'reviewing',
  FINISHED = 'finished',
  TRANSITION = 'transition'
}

interface LearningSessionProps {
  mode?: 'en_to_vi' | 'vi_to_en' | 'both';
  mercifulMode?: boolean;
}

export function useLearningSession({ mode = 'both', mercifulMode = false }: LearningSessionProps = {}) {
  const { user } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.LOADING);
  const [terms, setTerms] = useState<Term[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [reviewingItems, setReviewingItems] = useState<LearningItem[]>([]);
  const [learningList, setLearningList] = useState<LearningItem[]>([]);
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [filteredTermIndex, setFilteredTermIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<'en_to_vi' | 'vi_to_en'>('en_to_vi');
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Fetch dữ liệu từ vựng cần học
  const fetchLearningTerms = useCallback(async () => {
    setSessionState(SessionState.LOADING);
    setError(null);
    
    try {
      if (!user || !user.uid) {
        setError('Vui lòng đăng nhập để sử dụng tính năng này');
        return;
      }

      const response = await fetch(`/api/learning/smart?mode=${mode}`, {
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
        setLearningList(data.learningList);
        console.log('Số lượt học cần làm hôm nay:', data.learningList.length);
        console.log('Chi tiết từng lượt học:', data.learningList);
        setSessionState(SessionState.READY);
      } else {
        setLearningList([]);
        setSessionState(SessionState.FINISHED);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu học tập:', error);
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải dữ liệu học tập');
      setSessionState(SessionState.FINISHED);
    }
  }, [user, mode]);

  // Khởi tạo phiên học
  const startLearning = useCallback(() => {
    console.log('Danh sách lượt học sẽ học:', learningList);
    if (learningList.length > 0) {
      setSessionState(SessionState.LEARNING);
      setCurrentTermIndex(0);
      setFilteredTermIndex(0);
      setStats({ correct: 0, total: 0 });
      setLearningItems(learningList);
      
      if (mode === 'en_to_vi') {
        setCurrentMode('en_to_vi');
      } else if (mode === 'vi_to_en') {
        setCurrentMode('vi_to_en');
      } else {
        setCurrentMode(learningList[0].mode);
      }
    }
  }, [learningList, mode]);

  // Kiểm tra đáp án
  const checkAnswer = useCallback(async (answer: string) => {
    if (answer.trim().length === 0) return;
    
    const currentItem = getCurrentItem();
    if (!currentItem) return;
    
    let isCorrect = false;
    const answerMode = currentItem.mode;
    
    if (answerMode === 'en_to_vi') {
      const correctAnswers = Array.isArray(currentItem.term.meanings)
        ? currentItem.term.meanings
        : [currentItem.term.meanings];
      isCorrect = (correctAnswers as string[]).some((correctAnswer: string) =>
        normalizeForComparison(correctAnswer) === normalizeForComparison(answer)
      );
    } else {
      isCorrect = normalizeForComparison(currentItem.term.vocab) === normalizeForComparison(answer);
    }
    
    setIsAnswerCorrect(isCorrect);
    setStats(prev => ({ ...prev, total: prev.total + 1, correct: isCorrect ? prev.correct + 1 : prev.correct }));
    
    // Gọi API cập nhật level
    try {
      if (user && currentItem) {
        const response = await fetch('/api/learning/update-level', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'firebase_uid': user.uid
          },
          body: JSON.stringify({
            term_id: currentItem.term.id,
            is_correct: isCorrect,
            mode: answerMode
          })
        });
        
        if (!response.ok) {
          throw new Error(`Lỗi API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cập nhật lại state terms với level mới
        setTerms(prevTerms => prevTerms.map(term => {
          if (term.id === currentItem.term.id) {
            let newLevelEn = term.level_en;
            let newLevelVi = term.level_vi;
            
            if (data.field_updated === 'level_en') {
              newLevelEn = Math.max(0, data.new_level_en);
            }
            if (data.field_updated === 'level_vi') {
              newLevelVi = Math.max(0, data.new_level_vi);
            }
            
            return {
              ...term,
              level_en: newLevelEn,
              level_vi: newLevelVi,
              review_time_en: data.next_review_time_en || term.review_time_en,
              review_time_vi: data.next_review_time_vi || term.review_time_vi
            };
          }
          return term;
        }));
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật level:', error);
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi cập nhật tiến độ học tập');
    }
    
    return isCorrect;
  }, [user, getCurrentItem]);

  // Di chuyển đến từ tiếp theo
  const nextTerm = useCallback(async () => {
    const filteredItems = getFilteredItems();
    const isInReviewMode = sessionState === SessionState.LEARNING && reviewingItems.length > 0;
    
    if (isInReviewMode) {
      if (isAnswerCorrect) {
        setReviewingItems(prev => {
          const newReviewingItems = prev.filter((_, index) => index !== filteredTermIndex);
          if (newReviewingItems.length === 0) {
            setSessionState(SessionState.FINISHED);
            setIsAnswerCorrect(null);
            setUserAnswer('');
          } else {
            let newIndex = filteredTermIndex;
            if (newIndex >= newReviewingItems.length) newIndex = newReviewingItems.length - 1;
            setFilteredTermIndex(newIndex);
            setCurrentTermIndex(newIndex);
            setIsAnswerCorrect(null);
            setUserAnswer('');
          }
          return newReviewingItems;
        });
      } else {
        if (filteredTermIndex < reviewingItems.length - 1) {
          setFilteredTermIndex(prev => prev + 1);
          setCurrentTermIndex(prev => prev + 1);
          setIsAnswerCorrect(null);
          setUserAnswer('');
        } else {
          setSessionState(SessionState.FINISHED);
        }
      }
      return;
    }
    
    if (filteredTermIndex < filteredItems.length - 1) {
      setFilteredTermIndex(prev => prev + 1);
      setCurrentTermIndex(prev => prev + 1);
      setIsAnswerCorrect(null);
      setUserAnswer('');
    } else {
      // Kết thúc phiên học
      setSessionState(SessionState.FINISHED);
      
      // Tìm các từ sai để ôn tập lại
      if (terms.length > 0) {
        const reviewingList: LearningItem[] = [];
        terms.forEach(term => {
          if (term.status_learning_en === 'reviewing') {
            reviewingList.push({ term, mode: 'vi_to_en' });
          }
          if (term.status_learning_vi === 'reviewing') {
            reviewingList.push({ term, mode: 'en_to_vi' });
          }
        });
        
        if (reviewingList.length > 0) {
          setReviewingItems(reviewingList);
          setSessionState(SessionState.REVIEWING);
          setCurrentTermIndex(0);
          setFilteredTermIndex(0);
        }
      }
    }
  }, [filteredTermIndex, isAnswerCorrect, reviewingItems.length, sessionState, terms, getFilteredItems]);

  // Lấy danh sách các item cần học/ôn tập
  function getFilteredItems() {
    if (sessionState === SessionState.REVIEWING) {
      return reviewingItems;
    }
    if (sessionState === SessionState.LEARNING && learningItems.length > 0) {
      return learningItems;
    }
    if (sessionState === SessionState.LEARNING && reviewingItems.length > 0) {
      return reviewingItems;
    }
    return terms;
  }

  // Lấy item hiện tại
  function getCurrentItem() {
    const filtered = getFilteredItems();
    const item = filtered[filteredTermIndex];
    if (item && 'term' in item) return item as LearningItem;
    if (item) return { term: item as Term, mode: currentMode } as LearningItem;
    return undefined;
  }

  // Kiểm tra xem từ hiện tại có phải là từ mới không
  function isCurrentItemNew() {
    const currentItem = getCurrentItem();
    if (!currentItem) return false;
    return currentItem.mode === 'en_to_vi' ? currentItem.term.level_en === 0 : currentItem.term.level_vi === 0;
  }

  // Lấy mode hiện tại
  function getCurrentMode() {
    if (sessionState === SessionState.REVIEWING) {
      const filteredItems = getFilteredItems();
      return (filteredItems[filteredTermIndex] as LearningItem)?.mode || 'en_to_vi';
    }
    
    if (sessionState === SessionState.LEARNING && reviewingItems.length > 0) {
      return reviewingItems[filteredTermIndex]?.mode || currentMode;
    }
    
    return currentMode;
  }

  // Tải dữ liệu khi component mount
  useEffect(() => {
    if (user) {
      fetchLearningTerms();
    }
  }, [user, fetchLearningTerms]);

  return {
    sessionState,
    terms,
    learningItems,
    reviewingItems,
    currentTermIndex,
    filteredTermIndex,
    currentMode,
    userAnswer,
    isAnswerCorrect,
    stats,
    error,
    
    // Methods
    setUserAnswer,
    fetchLearningTerms,
    startLearning,
    checkAnswer,
    nextTerm,
    getFilteredItems,
    getCurrentItem,
    isCurrentItemNew,
    getCurrentMode,
  };
} 