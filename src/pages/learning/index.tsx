import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

const LearningPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra đăng nhập
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Lấy số lượng từ cần ôn tập
    const fetchReviewCount = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vocab?needReview=true');
        
        if (response.ok) {
          const data = await response.json();
          setReviewCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (error) {
        console.error('Error fetching review count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewCount();
  }, [user, router]);

  // Các chế độ học tập
  const learningModes = [
    {
      id: 'smart',
      title: 'Học thông minh',
      description: 'Hiệu quả nhất đối với những từ mới thêm vào',
      icon: '🧠',
      color: 'bg-primary-200',
      route: '/learning/smart'
    },
    {
      id: 'exam',
      title: 'Bài kiểm tra',
      description: 'Kiểm tra kiến thức với bài thi có thời gian và điểm số',
      icon: '📋',
      color: 'bg-secondary-200',
      route: '/learning/exam'
    },
    {
      id: 'writingcheck',
      title: 'Luyện tập viết writing',
      description: 'Luyện tập viết bài tập viết',
      icon: '✏️',
      color: 'bg-primary-200',
      route: '/writingcheck'
    },
    {
      id: 'IELTS Reading',
      title: 'IELTS Reading',
      description: 'Luyện đề IELTS Reading',
      icon: '📖',
      color: 'bg-error-200',
      route: '/learning/ielts-reading'
    },
    {
      id: 'Chọn loại từ',
      title: 'Part of speech',
      description: 'Kiểm tra và củng cố kiến thức về từ loại bằng cách phân loại từ vựng chính xác',
      icon: '🔄',
      color: 'bg-error-200',
      route: '/learning/part-of-speech'
    },
    {
      id: 'quiz',
      title: 'Trắc nghiệm',
      description: 'Kiểm tra kiến thức với câu hỏi trắc nghiệm',
      icon: '📝',
      color: 'bg-success-200',
      route: '/learning/quiz'
    },
    {
      id: 'Dictation',
      title: 'Gõ từ',
      description: 'Nghe và gõ từ',
      icon: '⌨️',
      color: 'bg-secondary-200',
      route: '/learning/dailydictation'
    },
    {
      id: 'storytelling',
      title: 'Học thuộc bằng truyện chêm',
      description: 'Học thuộc nghĩa của từ vựng bằng phương pháp truyện chêm',
      icon: '📚',
      color: 'bg-warning-200',
      route: '/learning/storytelling'
    },
  ];

  const navigateToMode = (route: string) => {
    router.push(route);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-50 mb-3">Chọn chế độ ôn tập</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {learningModes.map((mode) => {
            let gradient = '';
            switch (mode.id) {
              case 'smart':
                gradient = 'bg-gradient-to-br from-gray-700 to-primary-200'; // Xanh mint pastel
                break;
              case 'exam':
                gradient = 'bg-gradient-to-br from-gray-700 to-secondary-200'; // Tím lavender pastel
                break;
              case 'writingcheck':
                gradient = 'bg-gradient-to-br from-red-700 to-primary-200'; // Xanh mint pastel
                break;
              case 'IELTS Reading':
                gradient = 'bg-gradient-to-br from-purple-700 to-error-200'; // Đỏ cam pastel
                break;
              case 'Chọn loại từ':
                gradient = 'bg-gradient-to-br from-gray-700 to-error-200'; // Đỏ cam pastel
                break;
              case 'quiz':
                gradient = 'bg-gradient-to-br from-gray-700 to-success-200'; // Xanh lá pastel
                break;
              case 'Dictation':
                gradient = 'bg-gradient-to-br from-gray-700 to-info-200'; // Hồng san hô pastel
                break;
              case 'storytelling':
                gradient = 'bg-gradient-to-br from-gray-700 to-warning-200'; // Vàng pastel
                break;
              case 'spelling':
                gradient = 'bg-gradient-to-br from-gray-700 to-info-200'; // Hồng san hô pastel
                break;
              default:
                gradient = 'bg-gradient-to-br from-gray-700 to-gray-600';
            }
            return (
              <div
                key={mode.id}
                onClick={() => navigateToMode(mode.route)}
                className={
                  `group relative rounded-2xl shadow-lg cursor-pointer overflow-hidden transition-transform duration-200 hover:scale-105 border-0 ` +
                  gradient
                }
              >
                <div className="flex flex-col items-center justify-center py-10 px-6">
                  <div className="mb-4">
                    <span className="inline-flex items-center justify-center rounded-full bg-gray-800 bg-opacity-50 shadow-lg w-20 h-20 text-5xl group-hover:scale-110 transition-transform">
                      {mode.icon}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-50 mb-2 text-center tracking-wide">{mode.title}</h2>
                  <p className="text-base text-gray-300 mb-4 text-center min-h-[48px] font-semibold">{mode.description}</p>
                  <button className="mt-2 bg-gray-700 hover:bg-gray-600 transition-colors py-2 px-6 rounded-lg text-gray-50 font-bold shadow-lg text-base">
                    Bắt đầu
                  </button>
                </div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-gray-50 group-hover:ring-opacity-20 transition-all pointer-events-none"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LearningPage; 