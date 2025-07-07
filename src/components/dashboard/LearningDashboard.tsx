import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLearning } from '../../services/LearningContext';
import { useVocab } from '../../hooks/useVocab';
import LearningStats from './LearningStats';
import LearningCalendar from './LearningCalendar';
import DueTermsList from './DueTermsList';
import StudyReminder from './StudyReminder';

const LearningDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getAllTerms } = useVocab();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTerms: 0,
    mastered: 0,
    learning: 0,
    new: 0,
    dueToday: 0
  });

  useEffect(() => {
    const calculateStats = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const terms = await getAllTerms(); // Giả sử getAllTerms là async
        
        // Tính toán số liệu thống kê
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        
        const statsData = {
          totalTerms: terms.length,
          mastered: terms.filter(term => term.memoryStrength >= 4).length,
          learning: terms.filter(term => term.memoryStrength > 0 && term.memoryStrength < 4).length,
          new: terms.filter(term => term.memoryStrength === 0).length,
          dueToday: terms.filter(term => {
            if (!term.nextReviewDate) return false;
            const reviewDate = new Date(term.nextReviewDate);
            return reviewDate >= todayStart && reviewDate < todayEnd;
          }).length
        };
        
        setStats(statsData);
      } catch (error) {
        console.error('Error calculating stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateStats();
  }, [user]); // Bỏ getAllTerms khỏi dependency array

  if (isLoading) {
    return <div className="flex justify-center p-8">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-indigo-700">Tổng quan học tập</h1>
      
      {/* Thống kê tổng quan */}
      <div className="mb-8">
        <LearningStats stats={stats} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lịch học tập */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-indigo-600">Lịch học tập</h2>
          <LearningCalendar />
        </div>
        
        {/* Các từ đến hạn ôn tập */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-indigo-600">Từ vựng đến hạn ôn tập</h2>
          <DueTermsList />
        </div>
      </div>
      
      {/* Nhắc nhở học tập */}
      <div className="mt-8">
        <StudyReminder />
      </div>
    </div>
  );
};

export default LearningDashboard;
