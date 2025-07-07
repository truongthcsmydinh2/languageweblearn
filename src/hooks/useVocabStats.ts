import { useMemo } from 'react';
import { useVocab } from '@/contexts/VocabContext';
import { useLearningSession } from '@/contexts/LearningSessionContext';
import { VocabWord } from '@/types/vocab';

interface VocabStats {
  totalWords: number;
  newWords: number;
  learningWords: number;
  basicWords: number;
  masteredWords: number;
  dueToday: number;
  averageLevel: number;
  recentActivities: {
    type: 'review' | 'add' | 'other';
    description: string;
    detail: string;
    timeAgo: string;
  }[];
}

export const useVocabStats = () => {
  // Lấy dữ liệu từ VocabContext - được cập nhật để xử lý cả vocabSets và allTerms
  const { vocabSets, allTerms, loading: vocabLoading, error: vocabError } = useVocab();
  const { sessions, loading: sessionsLoading, error: sessionsError } = useLearningSession();
  
  const loading = vocabLoading || sessionsLoading;
  const error = vocabError || sessionsError;
  
  // Tính toán thống kê từ allTerms thay vì words
  const stats = useMemo<VocabStats>(() => {
    // Kiểm tra các trường hợp dữ liệu không có sẵn
    if (loading || error || !allTerms || allTerms.length === 0) {
      return {
        totalWords: 0,
        newWords: 0,
        learningWords: 0,
        basicWords: 0,
        masteredWords: 0,
        dueToday: 0,
        averageLevel: 0,
        recentActivities: []
      };
    }
    
    // Sử dụng allTerms thay vì words
    // Phân loại từ vựng theo level
    const newWordsCount = allTerms.filter(term => term.level === 0).length;
    const learningWordsCount = allTerms.filter(term => term.level >= 1 && term.level <= 3).length;
    const basicWordsCount = allTerms.filter(term => term.level >= 4 && term.level <= 7).length;
    const masteredWordsCount = allTerms.filter(term => term.level >= 8).length;
    
    // Từ đến hạn ôn tập hôm nay
    const now = new Date().getTime();
    const dueWordsCount = allTerms.filter(term => 
      term.reviewTime && term.reviewTime <= now
    ).length;
    
    // Tính level trung bình
    const totalLevel = allTerms.reduce((sum, term) => sum + (term.level || 0), 0);
    const avgLevel = allTerms.length > 0 ? totalLevel / allTerms.length : 0;
    
    // Tạo danh sách hoạt động gần đây
    let recentActivities = [];
    
    // Phiên học gần nhất
    if (sessions && sessions.length > 0) {
      const latestSession = sessions[0];
      const correct = latestSession.progress?.correct || 0;
      const total = latestSession.progress?.completed || 1;
      
      recentActivities.push({
        type: 'review',
        description: `Phiên học phần ${latestSession.section || 1}`,
        detail: `${correct}/${total} câu trả lời đúng (${Math.round((correct/total)*100)}%)`,
        timeAgo: formatTimeAgo(new Date(latestSession.startDate))
      });
    }
    
    // Từ mới được thêm gần đây
    if (allTerms.length > 0) {
      // Sắp xếp theo thời gian thêm
      const sortedTerms = [...allTerms].sort((a, b) => 
        (b.timeAdded || 0) - (a.timeAdded || 0)
      );
      
      const recentlyAddedTerms = sortedTerms.slice(0, 3);
      
      if (recentlyAddedTerms.length > 0) {
        recentActivities.push({
          type: 'add',
          description: 'Thêm từ mới',
          detail: `${recentlyAddedTerms.length} từ đã được thêm gần đây`,
          timeAgo: recentlyAddedTerms[0].timeAdded 
            ? formatTimeAgo(new Date(recentlyAddedTerms[0].timeAdded)) 
            : 'Gần đây'
        });
      }
    }
    
    return {
      totalWords: allTerms.length,
      newWords: newWordsCount,
      learningWords: learningWordsCount,
      basicWords: basicWordsCount,
      masteredWords: masteredWordsCount,
      dueToday: dueWordsCount,
      averageLevel: Number(avgLevel.toFixed(1)),
      recentActivities
    };
  }, [allTerms, sessions, loading, error]);
  
  // Thêm hàm refetch cho consistent với API
  const refetch = () => {
    // Nếu cần refresh dữ liệu
    console.log('Refreshing data...');
    // Thực tế VocabContext có thể không có refetch method
    // Nếu cần, có thể thêm vào VocabContext
  };
  
  return { stats, loading, error, refetch };
};

// Helper function to format timeAgo
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return diffDays === 1 ? '1 ngày trước' : `${diffDays} ngày trước`;
  }
  if (diffHours > 0) {
    return diffHours === 1 ? '1 giờ trước' : `${diffHours} giờ trước`;
  }
  if (diffMins > 0) {
    return diffMins === 1 ? '1 phút trước' : `${diffMins} phút trước`;
  }
  return 'Vừa xong';
} 