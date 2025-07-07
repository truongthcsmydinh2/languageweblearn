import React from 'react';

interface StatsProps {
  stats: {
    totalTerms: number;
    mastered: number;
    learning: number;
    new: number;
    dueToday: number;
  };
}

const LearningStats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard 
        title="Tổng số từ" 
        value={stats.totalTerms} 
        color="bg-indigo-50" 
        textColor="text-indigo-700" 
      />
      <StatCard 
        title="Đã thành thạo" 
        value={stats.mastered} 
        color="bg-emerald-50" 
        textColor="text-emerald-700" 
      />
      <StatCard 
        title="Đang học" 
        value={stats.learning} 
        color="bg-violet-50" 
        textColor="text-violet-700" 
      />
      <StatCard 
        title="Từ mới" 
        value={stats.new} 
        color="bg-amber-50" 
        textColor="text-amber-700" 
      />
      <StatCard 
        title="Đến hạn hôm nay" 
        value={stats.dueToday} 
        color="bg-rose-50" 
        textColor="text-rose-700" 
      />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  textColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, textColor }) => {
  return (
    <div className={`${color} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
};

export default LearningStats;
