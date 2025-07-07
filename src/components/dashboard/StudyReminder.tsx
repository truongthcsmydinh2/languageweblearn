import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDueTerms } from '../../services/vocabService';
import Link from 'next/link';

const StudyReminder: React.FC = () => {
  const { user } = useAuth();
  const [dueCount, setDueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastStudied, setLastStudied] = useState<string | null>(null);

  useEffect(() => {
    async function loadDueTerms() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Lấy số lượng từ đến hạn ôn tập
        const terms = await getDueTerms(user.uid);
        setDueCount(terms.length);
        
        // Lấy thời gian học cuối cùng từ localStorage
        const storedLastStudied = localStorage.getItem('lastStudied');
        setLastStudied(storedLastStudied);
      } catch (error) {
        console.error('Error loading due terms:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDueTerms();
  }, [user]);

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>;
  }

  // Không hiển thị nếu không có từ đến hạn ôn tập
  if (dueCount === 0) {
    return (
      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
        <h3 className="font-medium text-emerald-800">Bạn đã ôn tập tất cả từ vựng đến hạn!</h3>
        <p className="text-emerald-600 text-sm mt-1">
          Quay lại sau để tiếp tục hành trình học tập của bạn.
        </p>
      </div>
    );
  }

  // Lời nhắc học tập
  return (
    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
      <h3 className="font-medium text-indigo-800">
        {dueCount} từ vựng đang chờ bạn ôn tập!
      </h3>
      <p className="text-indigo-600 text-sm mt-1">
        {lastStudied ? (
          <>
            Lần cuối bạn học vào {lastStudied}. Hãy duy trì thói quen học tập!
          </>
        ) : (
          <>
            Bắt đầu hành trình học tập để cải thiện vốn từ vựng của bạn!
          </>
        )}
      </p>
      <div className="mt-3">
        <Link href="/learning" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors">
          Bắt đầu học ngay
        </Link>
      </div>
    </div>
  );
};

export default StudyReminder;
