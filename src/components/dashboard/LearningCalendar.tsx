import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllLearningHistory } from '../../services/learningService';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ActivityData {
  date: string;
  count: number;
}

const LearningCalendar: React.FC = () => {
  const { user } = useAuth();
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    async function loadActivityData() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Lấy tất cả lịch sử học tập
        const history = await getAllLearningHistory(user.uid);
        
        // Xử lý dữ liệu để tạo heatmap
        const activityCount: Record<string, number> = {};
        
        // Xử lý lịch sử cho mỗi từ
        Object.values(history).forEach(termHistory => {
          (termHistory as any).reviews?.forEach(review => {
            const date = review.date.split('T')[0]; // Format: YYYY-MM-DD
            activityCount[date] = (activityCount[date] || 0) + 1;
          });
        });
        
        // Chuyển đổi thành mảng
        const activityArray = Object.entries(activityCount).map(([date, count]) => ({
          date,
          count
        }));
        
        setActivityData(activityArray);
      } catch (error) {
        console.error('Error loading activity data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivityData();
  }, [user]);

  // Tạo mảng các ngày trong tuần hiện tại
  const weekDays = [...Array(7)].map((_, i) => addDays(currentWeekStart, i));
  
  // Di chuyển sang tuần trước
  const prevWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };
  
  // Di chuyển sang tuần sau
  const nextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  // Lấy dữ liệu hoạt động cho một ngày cụ thể
  const getActivityForDay = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return activityData.find(item => item.date === dateString)?.count || 0;
  };

  if (isLoading) {
    return <div className="animate-pulse h-60 bg-gray-100 rounded-lg"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={prevWeek}
          className="p-2 text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          ← Tuần trước
        </button>
        
        <h3 className="font-medium">
          {format(currentWeekStart, 'dd/MM/yyyy', { locale: vi })} - 
          {format(addDays(currentWeekStart, 6), 'dd/MM/yyyy', { locale: vi })}
        </h3>
        
        <button 
          onClick={nextWeek}
          className="p-2 text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Tuần sau →
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const activity = getActivityForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={day.toString()} className="text-center">
              <p className="text-xs text-black mb-1">
                {format(day, 'EEE', { locale: vi })}
              </p>
              <p className={`text-sm mb-2 ${isToday ? 'font-bold' : ''}`}>
                {format(day, 'd', { locale: vi })}
              </p>
              <ActivityCell count={activity} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ActivityCellProps {
  count: number;
}

const ActivityCell: React.FC<ActivityCellProps> = ({ count }) => {
  let bgColor = 'bg-gray-100';
  
  if (count > 0) {
    if (count < 5) bgColor = 'bg-indigo-100';
    else if (count < 10) bgColor = 'bg-indigo-300';
    else if (count < 20) bgColor = 'bg-indigo-500';
    else bgColor = 'bg-indigo-700';
  }
  
  return (
    <div 
      className={`h-8 rounded-md ${bgColor} flex items-center justify-center transition-colors`}
      title={`${count} từ đã ôn tập`}
    >
      {count > 0 && (
        <span className={`text-xs font-medium ${count > 10 ? 'text-black' : 'text-indigo-800'}`}>
          {count}
        </span>
      )}
    </div>
  );
};

export default LearningCalendar;
