import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const useRequireAuth = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Chỉ kiểm tra sau khi đã load xong trạng thái authentication
    if (!loading && !user) {
      // Lưu lại URL hiện tại để sau khi đăng nhập có thể quay lại
      const returnUrl = encodeURIComponent(router.asPath);
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [user, loading, router]);

  return { user, loading };
};

export default useRequireAuth;
