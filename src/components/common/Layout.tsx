import React, { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  hideNavbar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'Ứng dụng học từ vựng', hideNavbar = false }) => {
  const { user, logout } = useAuth();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      
      <div className="min-h-screen flex flex-col bg-gray-800">
        <header className={hideNavbar ? 'hidden' : 'bg-gray-700 shadow-sm'}>
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-primary-200">
                  VocabApp
                </Link>
              </div>
              
              <nav className="flex items-center space-x-4">
                {user ? (
                  <>
                    <Link href="/dashboard" className="text-gray-50 hover:text-primary-200">
                      Dashboard
                    </Link>
                    <Link href="/vocab" className="text-gray-50 hover:text-primary-200">
                      Từ vựng
                    </Link>
                    <Link href="/learning" className="text-gray-50 hover:text-primary-200">
                      Học tập
                    </Link>
                    <button 
                      onClick={() => logout()}
                      className="text-gray-50 hover:text-primary-200"
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-gray-50 hover:text-primary-200">
                      Đăng nhập
                    </Link>
                    <Link href="/register" className="px-4 py-2 bg-primary-200 text-gray-800 rounded-md hover:bg-primary-300">
                      Đăng ký
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>
        
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout;
