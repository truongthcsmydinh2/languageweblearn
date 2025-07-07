import React from 'react';

interface LevelInfo {
  description: string;
  reviewInterval: string;
}

interface LearningScheduleProps {
  levels: Record<string, LevelInfo>;
}

const LearningSchedule = React.memo(({ levels }: LearningScheduleProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Lịch học tập</h3>
      <div className="space-y-3">
        {Object.entries(levels).map(([level, info]) => (
          <div key={level} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-600">Level {level}</span>
              <p className="text-xs text-gray-500 mt-1">{info.description}</p>
            </div>
            <span className="text-sm font-medium text-indigo-600">{info.reviewInterval}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

LearningSchedule.displayName = 'LearningSchedule';

export default LearningSchedule; 