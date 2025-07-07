import React from 'react';

interface Activity {
  type: 'review' | 'add' | 'other';
  description: string;
  detail: string;
  timeAgo: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

const RecentActivities = React.memo(({ activities }: RecentActivitiesProps) => {
  // Fallback data if no activities provided
  const defaultActivities: Activity[] = [
    {
      type: 'review',
      description: 'Ôn tập thành công',
      detail: '10 từ đã được nâng cấp',
      timeAgo: '2 giờ trước'
    },
    {
      type: 'add',
      description: 'Thêm từ mới',
      detail: '5 từ đã được thêm vào',
      timeAgo: '1 ngày trước'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Hoạt động gần đây</h3>
      <div className="space-y-4">
        {displayActivities.map((activity, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <ActivityIcon type={activity.type} />
              <div>
                <p className="text-sm font-medium text-gray-700">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.detail}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">{activity.timeAgo}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'review':
      return (
        <div className="bg-green-100 p-2 rounded-full">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case 'add':
      return (
        <div className="bg-blue-100 p-2 rounded-full">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="bg-gray-100 p-2 rounded-full">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
};

RecentActivities.displayName = 'RecentActivities';

export default RecentActivities; 