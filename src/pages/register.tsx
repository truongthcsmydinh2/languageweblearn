import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { signUp, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await signUp(email, password, name || email.split('@')[0]);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email không hợp lệ');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu');
      } else {
        setError(err.message || 'Đã xảy ra lỗi khi đăng ký');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Google sign up error:', err);
      setError(err.message || 'Đã xảy ra lỗi khi đăng ký với Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Đăng ký | Ứng dụng học từ vựng</title>
        <meta name="description" content="Đăng ký tài khoản mới cho ứng dụng học từ vựng" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-50">
              Tạo tài khoản mới
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Hoặc{' '}
              <Link href="/login" className="font-medium text-secondary-200 hover:text-secondary-300">
                đăng nhập nếu bạn đã có tài khoản
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
                <label htmlFor="name" className="sr-only">Họ tên</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-700 text-gray-50 rounded-t-md focus:outline-none focus:ring-primary-200 focus:border-primary-200 focus:z-10 sm:text-sm"
                  placeholder="Họ tên (tùy chọn)"
                />
              </div>
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
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-700 text-gray-50 focus:outline-none focus:ring-primary-200 focus:border-primary-200 focus:z-10 sm:text-sm"
                  placeholder="Địa chỉ email"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Mật khẩu</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-700 text-gray-50 focus:outline-none focus:ring-primary-200 focus:border-primary-200 focus:z-10 sm:text-sm"
                  placeholder="Mật khẩu"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">Xác nhận mật khẩu</label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-700 text-gray-50 rounded-b-md focus:outline-none focus:ring-primary-200 focus:border-primary-200 focus:z-10 sm:text-sm"
                  placeholder="Xác nhận mật khẩu"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-800 bg-primary-200 hover:bg-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-300 disabled:opacity-50 mb-3"
              >
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
              
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-600 text-sm font-medium rounded-md text-gray-50 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                  />
                </svg>
                Đăng ký với Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;

