import { useState, useEffect, useCallback } from 'react';
import { VocabWord, LearningSession } from '@/types/vocab';
import { VocabService } from '@/services/vocabService';
import { useAuth } from '@/contexts/AuthContext';
import { useVocab } from '@/contexts/VocabContext';

export const useLearningSession = (section: number) => {
  const { user } = useAuth();
  const { words, updateWord } = useVocab();
  
  const [session, setSession] = useState<LearningSession | null>(null);
  const [currentWords, setCurrentWords] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWords: 0,
    newWords: 0,
    reviewWords: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    completionRate: 0
  });
  
  // Khởi tạo phiên học
  const initSession = useCallback(() => {
    if (!user || !words.length) return;
    
    setIsLoading(true);
    
    // Tạo phiên học mới
    const newSession = VocabService.getWordsForSession(words, section, user.id);
    setSession(newSession);
    
    // Lấy danh sách từ hiển thị
    const displayWords = VocabService.getDisplayWords(newSession, words);
    setCurrentWords(displayWords);
    
    // Cập nhật thống kê
    setStats({
      totalWords: displayWords.length,
      newWords: newSession.newWords.length,
      reviewWords: newSession.reviewWords.length,
      correctAnswers: 0,
      incorrectAnswers: 0,
      completionRate: 0
    });
    
    setCurrentIndex(0);
    setIsLoading(false);
  }, [user, words, section]);
  
  // Xử lý khi trả lời
  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (!session || currentIndex >= currentWords.length) return;
    
    const currentWord = currentWords[currentIndex];
    
    // Cập nhật từ
    const updatedWord = VocabService.updateWordAfterAnswer(currentWord, isCorrect);
    updateWord(updatedWord);
    
    // Cập nhật session
    setSession(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        progress: {
          ...prev.progress,
          completed: prev.progress.completed + 1,
          correct: prev.progress.correct + (isCorrect ? 1 : 0),
          incorrect: prev.progress.incorrect + (isCorrect ? 0 : 1)
        }
      };
    });
    
    // Cập nhật thống kê
    setStats(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      incorrectAnswers: prev.incorrectAnswers + (isCorrect ? 0 : 1),
      completionRate: (prev.correctAnswers + (isCorrect ? 1 : 0)) / prev.totalWords * 100
    }));
    
    // Chuyển đến từ tiếp theo
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, currentWords, session, updateWord]);
  
  // Kết thúc phiên học
  const finishSession = useCallback(() => {
    if (!session) return;
    
    setSession(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        endDate: new Date(),
        isCompleted: true
      };
    });
    
    // TODO: Lưu kết quả phiên học vào database
  }, [session]);
  
  // Kiểm tra xem phiên học đã kết thúc chưa
  const isSessionFinished = currentIndex >= currentWords.length;
  
  // Lấy từ hiện tại
  const currentWord = currentIndex < currentWords.length ? currentWords[currentIndex] : null;
  
  // Khởi tạo phiên học khi component mount
  useEffect(() => {
    initSession();
  }, [initSession]);
  
  return {
    session,
    currentWord,
    currentIndex,
    totalWords: currentWords.length,
    stats,
    isLoading,
    isSessionFinished,
    handleAnswer,
    finishSession,
    resetSession: initSession
  };
}; 