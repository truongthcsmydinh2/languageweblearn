'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  loginWithEmail, 
  loginWithGoogle, 
  signUpWithEmail, 
  logout,
  onAuthStateChanged 
} from '../firebase/config';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/router';

interface UserWithAdmin extends User {
  is_admin?: boolean;
}

interface AuthContextType {
  user: UserWithAdmin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  logout: async () => {},
  signInWithGoogle: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserWithAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user data from database to get is_admin status
        try {
          const response = await fetch('/api/user/profile', {
            headers: {
              'firebase_uid': user.uid
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser({
              ...user,
              is_admin: userData.is_admin || false
            });
          } else {
            setUser(user);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await loginWithEmail(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Đăng nhập thất bại');
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      await signUpWithEmail(email, password, displayName);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Đăng ký thất bại');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(error.message || 'Đăng nhập với Google thất bại');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Đăng xuất thất bại');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      logout: handleLogout,
      signInWithGoogle: handleGoogleSignIn
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
