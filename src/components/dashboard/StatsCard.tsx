import React from 'react';

interface ProgressProps {
  current: number;
  total: number;
  percentage: number;
  label: string;
}

interface ActionButtonProps {
  text: string;
  onClick: () => void;
  ariaLabel?: string;
}

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  accentColor: string;
  progress?: ProgressProps;
  actionButton?: ActionButtonProps;
}

const StatsCard = React.memo(({ 
  title, 
  value, 
  icon, 
  accentColor, 
  progress, 
  actionButton 
}: StatsCardProps) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-t-4 border-${accentColor}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className={`text-3xl font-bold text-${accentColor}-600 mt-1`}>
            {value}
          </h3>
        </div>
        <div className={`bg-${accentColor}-100 p-3 rounded-full`}>
          {icon}
        </div>
      </div>
      
      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{progress.label}</span>
            <span className={`text-${accentColor}-600 font-medium`}>
              {progress.percentage}%
            </span>
          </div>
          <div 
            className="h-2 bg-gray-200 rounded-full mt-1"
            role="progressbar"
            aria-valuenow={progress.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress.label}: ${progress.percentage}%`}
          >
            <div 
              className={`h-full bg-${accentColor}-500 rounded-full`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}
      
      {actionButton && (
        <button 
          onClick={actionButton.onClick}
          className={`mt-4 w-full py-2 bg-${accentColor}-100 text-${accentColor}-600 rounded-lg hover:bg-${accentColor}-200 transition-colors text-sm font-medium`}
          aria-label={actionButton.ariaLabel || actionButton.text}
        >
          {actionButton.text}
        </button>
      )}
    </div>
  );
});

StatsCard.displayName = 'StatsCard';

export default StatsCard; 