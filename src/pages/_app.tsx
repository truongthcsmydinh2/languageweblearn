import "@/styles/globals.css";
// import 'bootstrap/dist/css/bootstrap.min.css'; // Loại bỏ Bootstrap CSS để tránh xung đột với Turbopack
import type { AppProps } from "next/app";
import { AuthProvider } from '@/contexts/AuthContext';
import { VocabProvider } from '@/contexts/VocabContext';
import { LearningSessionProvider } from '@/contexts/LearningSessionContext';
import { UserSettingsProvider } from '@/contexts/UserSettingsContext';
import Layout from '../components/common/Layout';
import { useEffect, useState } from 'react';
import { app, db, auth, initAnalytics } from '@/firebase/config';
import { initWebSocket } from '@/lib/websocket';
import '@fontsource/inter/latin.css';
import '@fontsource/be-vietnam-pro/vietnamese.css';

export default function App({ Component, pageProps }: AppProps) {
  // Sử dụng state để đảm bảo Firebase chỉ được khởi tạo ở client-side
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    // Đảm bảo code này chỉ chạy ở client-side
    setFirebaseInitialized(true);
    initAnalytics();
    
    // Khởi tạo WebSocket cho HMR
    if (process.env.NODE_ENV === 'development') {
      initWebSocket();
    }
  }, []);

  // Chỉ render ứng dụng khi Firebase đã khởi tạo thành công
  if (!firebaseInitialized) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
      </div>
    );
  }

  // Hỗ trợ getLayout cho từng page
  const getLayout = (Component as any).getLayout || ((page: React.ReactNode) => <Layout>{page}</Layout>);

  return (
    <AuthProvider>
      <VocabProvider>
        <LearningSessionProvider>
          <UserSettingsProvider>
            {getLayout(<Component {...pageProps} />)}
          </UserSettingsProvider>
        </LearningSessionProvider>
      </VocabProvider>
    </AuthProvider>
  );
}
