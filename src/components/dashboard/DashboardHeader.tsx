import React from 'react';

interface DashboardHeaderProps {
  userName: string;
  welcomeMessage: string;
}

const DashboardHeader = React.memo(({ userName, welcomeMessage }: DashboardHeaderProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-indigo-800">
            Xin chào, {userName}
          </h1>
          <p className="text-gray-600 mt-1">{welcomeMessage}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Hôm nay</p>
          <p className="text-lg font-semibold text-indigo-600">
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader; 