// src/components/learning/LearningModeSelector.tsx
import React from 'react';
import Link from 'next/link';

interface Mode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const LearningModeSelector: React.FC = () => {
  const modes: Mode[] = [
    {
      id: 'flashcard',
      name: 'Thẻ ghi nhớ',
      description: 'Ôn tập với thẻ ghi nhớ hai mặt để tự đánh giá trí nhớ của bạn',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'quiz',
      name: 'Trắc nghiệm',
      description: 'Kiểm tra kiến thức của bạn với các câu hỏi trắc nghiệm',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'writing',
      name: 'Viết từ',
      description: 'Luyện tập ghi nhớ bằng cách viết lại từ vựng',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      id: 'smart',
      name: 'Học thông minh',
      description: 'Kết hợp các phương pháp dựa trên thuật toán SRS để tối ưu việc học',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Chọn phương pháp học tập</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {modes.map((mode) => (
          <Link 
            key={mode.id}
            href={`/learning/${mode.id}`}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="flex justify-center mb-4">
              {mode.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              {mode.name}
            </h3>
            <p className="mt-2 text-sm text-gray-600 text-center">
              {mode.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LearningModeSelector;