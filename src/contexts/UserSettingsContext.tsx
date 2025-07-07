import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/firebase/config';
import { ref, get, set } from 'firebase/database';

interface UserSettings {
  dailyGoal: number;           // Số từ mục tiêu mỗi ngày
  notificationsEnabled: boolean; // Bật/tắt thông báo
  darkMode: boolean;           // Chế độ tối
  soundEnabled: boolean;       // Bật/tắt âm thanh
  studyReminders: boolean;     // Bật/tắt lời nhắc học tập
}

const defaultSettings: UserSettings = {
  dailyGoal: 20,
  notificationsEnabled: true,
  darkMode: false,
  soundEnabled: true,
  studyReminders: true
};

interface UserSettingsContextProps {
  settings: UserSettings;
  loading: boolean;
  error: Error | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextProps | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch settings khi user thay đổi
  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setSettings(defaultSettings);
      setLoading(false);
    }
  }, [user]);

  // Lấy cài đặt từ Realtime Database
  const fetchSettings = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const settingsRef = ref(db, `userSettings/${user.uid}`);
      const snapshot = await get(settingsRef);
      
      if (snapshot.exists()) {
        setSettings({
          ...defaultSettings, // Luôn có giá trị mặc định
          ...snapshot.val()
        });
      } else {
        // Nếu chưa có settings, tạo mới với giá trị mặc định
        await set(ref(db, `userSettings/${user.uid}`), defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error('Error fetching user settings:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật cài đặt
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Cập nhật trong Realtime Database
      await set(ref(db, `userSettings/${user.uid}`), updatedSettings);
      
      // Cập nhật state
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Error updating user settings:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    }
  };

  return (
    <UserSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSettings
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};

// Hook để sử dụng context
export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}; 