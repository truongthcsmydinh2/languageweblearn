// src/pages/login.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  
  // Nếu đã đăng nhập, chuyển hướng đến dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email hoặc mật khẩu không đúng');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.');
      } else {
        setError(err.message || 'Đã xảy ra lỗi khi đăng nhập');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Đăng nhập với Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Đăng nhập | Ứng dụng học từ vựng</title>
        <meta name="description" content="Đăng nhập vào ứng dụng học từ vựng" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-50">
              Đăng nhập vào tài khoản
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Hoặc{' '}
              <Link href="/register" className="font-medium text-secondary-200 hover:text-secondary-300">
                đăng ký nếu bạn chưa có tài khoản
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-error-200 text-gray-800 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-700 text-gray-50 rounded-t-md focus:outline-none focus:ring-primary-200 focus:border-primary-200 focus:z-10 sm:text-sm"
                  placeholder="Địa chỉ email"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Mật khẩu</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-700 text-gray-50 rounded-b-md focus:outline-none focus:ring-primary-200 focus:border-primary-200 focus:z-10 sm:text-sm"
                  placeholder="Mật khẩu"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-200 focus:ring-primary-200 border-gray-600 rounded bg-gray-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-50">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-secondary-200 hover:text-secondary-300">
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-800 bg-primary-200 hover:bg-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-300 disabled:opacity-50 mb-3"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-md text-gray-50 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-200 disabled:opacity-50"
              >
                <img src="/google-icon.svg" alt="Google" className="w-6 h-6 mr-2" />
                Đăng nhập bằng Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;