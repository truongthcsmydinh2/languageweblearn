import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout';
import { MdPlayArrow, MdSchool, MdMenuBook } from 'react-icons/md';

const HomePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Kiểm tra xem người dùng đã đăng nhập chưa
  useEffect(() => {
    if (user && !authLoading) {
      // Nếu đã đăng nhập, chuyển hướng đến trang dashboard
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);
  
  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      {/* Hero section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Chào mừng đến với Vocab App</h1>
            <p className="text-xl md:text-2xl mb-8">
              Nền tảng học tiếng Anh hiệu quả với các bài học được thiết kế riêng cho bạn.
            </p>
            <div className="flex gap-4">
              <Link 
                href="/login" 
                className="inline-block bg-primary-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-primary-300 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link 
                href="/register" 
                className="inline-block bg-transparent border-2 border-secondary-200 text-secondary-200 px-6 py-3 rounded-lg font-medium hover:bg-secondary-200/10 transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-700 p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
              <MdSchool className="w-6 h-6 text-primary-200" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-50">Học từ vựng</h3>
            <p className="text-gray-400">
              Học từ vựng mới thông qua các bài học tương tác và bài tập thực hành.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-gray-700 p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
              <MdMenuBook className="w-6 h-6 text-secondary-200" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-50">Đọc truyện</h3>
            <p className="text-gray-400">
              Đọc các câu chuyện thú vị và học từ vựng trong ngữ cảnh thực tế.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-gray-700 p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
              <MdPlayArrow className="w-6 h-6 text-primary-200" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-50">Luyện nghe</h3>
            <p className="text-gray-400">
              Cải thiện kỹ năng nghe với các bài dictation và audio chất lượng cao.
            </p>
          </div>
        </div>
        
        {/* Call to action */}
        <div className="mt-16 bg-gray-700 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-50 mb-4">Bắt đầu học ngay hôm nay</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Đăng ký tài khoản để truy cập tất cả các tính năng và bắt đầu hành trình học tiếng Anh của bạn.
          </p>
          <Link 
            href="/register" 
            className="inline-block bg-primary-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-primary-300 transition-colors"
          >
            Đăng ký miễn phí
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export default HomePage;
