import React from 'react';

interface ErrorDisplayProps {
  errorMessage: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage, onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 mt-10">
        <div className="flex items-center text-red-500 mb-4">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium">Đã xảy ra lỗi</h3>
        </div>
        <p className="text-gray-600 mb-4">{errorMessage}. Vui lòng thử lại sau.</p>
        <button 
          onClick={onRetry || (() => window.location.reload())}
          className="w-full py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay; 