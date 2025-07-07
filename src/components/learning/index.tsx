// src/pages/learning/index.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LearningModeSelector from '../../components/learning/LearningModeSelector';
import { useRouter } from 'next/router';

const LearningPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Chuyển hướng nếu chưa đăng nhập
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Sẽ chuyển hướng, không cần hiển thị gì ở đây
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Học tập</h1>
      
      <LearningModeSelector />
    </div>
  );
};

export default LearningPage;