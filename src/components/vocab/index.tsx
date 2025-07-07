// src/pages/vocab/index.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import VocabSetList from '../../components/vocab/VocabSetList';
import Link from 'next/link';
import { useRouter } from 'next/router';

const VocabPage: React.FC = () => {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bộ sưu tập từ vựng</h1>
        <Link href="/vocab/new" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Tạo bộ từ vựng mới
        </Link>
      </div>
      
      <VocabSetList />
    </div>
  );
};

export default VocabPage;