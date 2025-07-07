import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import SignUpForm from '@/components/auth/SignUpForm';
import Link from 'next/link';

const SignUpPage: React.FC = () => {
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
      <SignUpForm />
      
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Đã có tài khoản?{' '}
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage; 