import React from 'react';

interface LevelStatProps {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface LevelAnalysisProps {
  levelStats: LevelStatProps[];
  className?: string;
}

const LevelAnalysis = React.memo(({ levelStats, className = '' }: LevelAnalysisProps) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-500 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Phân tích theo cấp độ</h3>
      <div className="space-y-3">
        {levelStats.map((stat, index) => (
          <div key={index}>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <span className="text-sm font-medium text-emerald-600">{stat.count} từ</span>
            </div>
            <div 
              className="h-2 bg-gray-200 rounded-full"
              role="progressbar"
              aria-valuenow={stat.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${stat.label}: ${stat.percentage}%`}
            >
              <div 
                className={`h-full bg-${stat.color}-500 rounded-full`}
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

LevelAnalysis.displayName = 'LevelAnalysis';

export default LevelAnalysis; 