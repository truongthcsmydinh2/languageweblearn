import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import SignInForm from '@/components/auth/SignInForm';
import Link from 'next/link';

const SignInPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Chuyển hướng nếu đã đăng nhập
  React.useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <SignInForm />
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Chưa có tài khoản?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignInPage; 