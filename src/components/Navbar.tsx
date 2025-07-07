import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

const Navbar = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    // ...
    <button onClick={handleLogout}>Đăng xuất</button>
    // ...
  );
};

export default Navbar; 