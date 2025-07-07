import React, { createContext, useContext, useState, useEffect } from 'react';
import { LearningSession } from '@/types/vocab';
import { useAuth } from './AuthContext';
import { db } from '@/firebase/config';
import { ref, get, set, push, update, remove } from 'firebase/database';

interface LearningSessionContextProps {
  sessions: LearningSession[];
  currentSession: LearningSession | null;
  loading: boolean;
  error: Error | null;
  createSession: (session: Omit<LearningSession, 'id'>) => Promise<LearningSession>;
  updateSession: (session: LearningSession) => Promise<void>;
  completeSession: (session: LearningSession) => Promise<void>;
  resetCurrentSession: () => void;
}

const LearningSessionContext = createContext<LearningSessionContextProps | undefined>(undefined);

export const LearningSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch sessions khi user thay đổi
  useEffect(() => {
    if (user) {
      fetchSessions();
    } else {
      setSessions([]);
      setCurrentSession(null);
      setLoading(false);
    }
  }, [user]);

  // Lấy danh sách phiên học từ Realtime Database
  const fetchSessions = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const sessionsRef = ref(db, 'learningSessions');
      const snapshot = await get(sessionsRef);
      
      const sessionsData: LearningSession[] = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Lọc theo userId tại client
        Object.keys(data).forEach(key => {
          if (data[key].userId === user.uid) {
            sessionsData.push({
              id: key,
              userId: data[key].userId,
              startDate: new Date(data[key].startDate),
              endDate: data[key].endDate ? new Date(data[key].endDate) : null,
              section: data[key].section,
              newWords: data[key].newWords || [],
              reviewWords: data[key].reviewWords || [],
              progress: data[key].progress || { completed: 0, correct: 0, incorrect: 0 },
              isCompleted: data[key].isCompleted || false
            });
          }
        });
      }

      // Sort by startDate (newest first)
      sessionsData.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
      
      setSessions(sessionsData);
      
      // Set current session if there's an incomplete one
      const incomplete = sessionsData.find(s => !s.isCompleted);
      if (incomplete) {
        setCurrentSession(incomplete);
      }
    } catch (err) {
      console.error('Error fetching learning sessions:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  // Tạo phiên học mới
  const createSession = async (session: Omit<LearningSession, 'id'>): Promise<LearningSession> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Chuyển Date thành timestamp
      const sessionData = {
        ...session,
        startDate: session.startDate.getTime(),
        endDate: session.endDate ? session.endDate.getTime() : null
      };

      // Thêm vào Realtime Database
      const newSessionRef = push(ref(db, 'learningSessions'));
      await set(newSessionRef, sessionData);
      
      // Tạo session object với ID
      const newSession: LearningSession = {
        ...session,
        id: newSessionRef.key as string
      };
      
      // Cập nhật state
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      
      return newSession;
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    }
  };

  // Cập nhật phiên học
  const updateSession = async (session: LearningSession) => {
    if (!user) return;

    try {
      // Chuyển Date thành timestamp
      const { id, ...data } = session;
      const updateData = {
        ...data,
        startDate: session.startDate.getTime(),
        endDate: session.endDate ? session.endDate.getTime() : null
      };
      
      // Cập nhật trong Realtime Database
      await update(ref(db, `learningSessions/${id}`), updateData);
      
      // Cập nhật state
      setSessions(prev => prev.map(s => s.id === id ? session : s));
      if (currentSession?.id === id) {
        setCurrentSession(session);
      }
    } catch (err) {
      console.error('Error updating session:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    }
  };

  // Hoàn thành phiên học
  const completeSession = async (session: LearningSession) => {
    if (!user) return;

    try {
      const updatedSession = {
        ...session,
        isCompleted: true,
        endDate: new Date()
      };
      
      await updateSession(updatedSession);
      setCurrentSession(null);
    } catch (err) {
      console.error('Error completing session:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    }
  };

  // Reset current session
  const resetCurrentSession = () => {
    setCurrentSession(null);
  };

  return (
    <LearningSessionContext.Provider
      value={{
        sessions,
        currentSession,
        loading,
        error,
        createSession,
        updateSession,
        completeSession,
        resetCurrentSession
      }}
    >
      {children}
    </LearningSessionContext.Provider>
  );
};

// Hook để sử dụng context
export const useLearningSession = () => {
  const context = useContext(LearningSessionContext);
  if (context === undefined) {
    throw new Error('useLearningSession must be used within a LearningSessionProvider');
  }
  return context;
}; 