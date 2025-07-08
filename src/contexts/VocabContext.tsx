import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Term {
  id: string;
  vocab: string;
  meaning: string;
  example?: string;
  notes?: string;
  level: number;
  timeAdded: number;
  reviewTime?: number;
}

interface VocabSet {
  id: string;
  title: string;
  description?: string;
  language?: string;
  createdAt: number;
  terms: Term[];
}

interface VocabSets {
  [key: string]: VocabSet;
}

interface VocabContextType {
  vocabSets: VocabSets | null;
  loading: boolean;
  error: string | null;
  addVocabSet: (set: Partial<VocabSet>) => Promise<string | null>;
  updateVocabSet: (id: string, data: Partial<VocabSet>) => Promise<boolean>;
  deleteVocabSet: (id: string) => Promise<boolean>;
  addTerm: (term: Partial<Term> & { setId: string }) => Promise<string | null>;
  updateTerm: (id: string, data: Partial<Term>) => Promise<boolean>;
  deleteTerm: (id: string, setId: string) => Promise<boolean>;
  dbStatus: {
    mysqlConnected: boolean;
    lastChecked: number | null;
  };
  checkDatabaseConnection: () => Promise<boolean>;
}

const VocabContext = createContext<VocabContextType | undefined>(undefined);

export const VocabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [vocabSets, setVocabSets] = useState<VocabSets | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    mysqlConnected: boolean;
    lastChecked: number | null;
  }>({
    mysqlConnected: false,
    lastChecked: null
  });

  // Lấy tất cả bộ từ vựng
  const fetchVocabSets = async () => {
    if (!user) {
      setVocabSets(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Thử lấy dữ liệu từ API
      try {
        const response = await fetch(`/api/vocab-sets?userId=${user.uid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch vocab sets');
        }
        
        const data = await response.json();
        setVocabSets(data);
      } catch (err) {
        
        // Dữ liệu mẫu với cấu trúc đúng
        setVocabSets({
          "default": {
            "id": "default",
            "title": "Default Vocabulary Set",
            "description": "This is a fallback vocabulary set",
            "language": "en",
            "createdAt": Date.now(),
            "terms": [] // Đảm bảo có thuộc tính terms dù rỗng
          }
        });
      }
    } catch (err) {
      setError(`Failed to fetch vocab sets: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Thêm bộ từ vựng mới
  const addVocabSet = async (set: Partial<VocabSet>): Promise<string | null> => {
    if (!user) return null;

    try {
      const response = await fetch('/api/vocab-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...set,
          userId: user.uid
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add vocab set');
      }

      const { id } = await response.json();
      
      // Cập nhật state
      setVocabSets(prev => {
        if (!prev) return { [id]: { ...set as VocabSet, id, terms: [] } };
        return {
          ...prev,
          [id]: { ...set as VocabSet, id, terms: [] }
        };
      });
      
      return id;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Cập nhật bộ từ vựng
  const updateVocabSet = async (id: string, data: Partial<VocabSet>): Promise<boolean> => {
    if (!user || !vocabSets || !vocabSets[id]) return false;

    try {
      const response = await fetch('/api/vocab-sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });

      if (!response.ok) {
        throw new Error('Failed to update vocab set');
      }

      // Cập nhật state
      setVocabSets(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [id]: { ...prev[id], ...data }
        };
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Xóa bộ từ vựng
  const deleteVocabSet = async (id: string): Promise<boolean> => {
    if (!user || !vocabSets || !vocabSets[id]) return false;

    try {
      const response = await fetch(`/api/vocab-sets?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete vocab set');
      }

      // Cập nhật state
      setVocabSets(prev => {
        if (!prev) return prev;
        const newSets = { ...prev };
        delete newSets[id];
        return newSets;
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Thêm từ vựng mới
  const addTerm = async (term: Partial<Term> & { setId: string }): Promise<string | null> => {
    if (!user || !vocabSets || !vocabSets[term.setId]) return null;

    try {
      const response = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(term)
      });

      if (!response.ok) {
        throw new Error('Failed to add term');
      }

      const { id } = await response.json();
      
      // Cập nhật state
      setVocabSets(prev => {
        if (!prev) return prev;
        
        const setId = term.setId;
        const newTerm: Term = {
          id,
          vocab: term.vocab || '',
          meaning: term.meaning || '',
          example: term.example,
          notes: term.notes,
          level: term.level || 0,
          timeAdded: Date.now(),
          reviewTime: term.reviewTime
        };
        
        return {
          ...prev,
          [setId]: {
            ...prev[setId],
            terms: [...prev[setId].terms, newTerm]
          }
        };
      });
      
      return id;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Cập nhật từ vựng
  const updateTerm = async (id: string, data: Partial<Term>): Promise<boolean> => {
    if (!user || !vocabSets) return false;
    
    // Tìm set chứa term
    let setId: string | null = null;
    
    for (const [key, set] of Object.entries(vocabSets)) {
      if (set.terms.some(t => t.id === id)) {
        setId = key;
        break;
      }
    }
    
    if (!setId) return false;

    try {
      const response = await fetch('/api/terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });

      if (!response.ok) {
        throw new Error('Failed to update term');
      }

      // Cập nhật state
      setVocabSets(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          [setId!]: {
            ...prev[setId!],
            terms: prev[setId!].terms.map(t => 
              t.id === id ? { ...t, ...data } : t
            )
          }
        };
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Xóa từ vựng
  const deleteTerm = async (id: string, setId: string): Promise<boolean> => {
    if (!user || !vocabSets || !vocabSets[setId]) return false;

    try {
      const response = await fetch(`/api/terms?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete term');
      }

      // Cập nhật state
      setVocabSets(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          [setId]: {
            ...prev[setId],
            terms: prev[setId].terms.filter(t => t.id !== id)
          }
        };
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Thêm hàm kiểm tra kết nối
  const checkDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/check-mysql');
      const data = await response.json();
      
      setDbStatus({
        mysqlConnected: data.success,
        lastChecked: Date.now()
      });
      
      return data.success;
    } catch (error) {
      setDbStatus({
        mysqlConnected: false,
        lastChecked: Date.now()
      });
      return false;
    }
  };

  // Lấy dữ liệu khi component mount hoặc user thay đổi
  useEffect(() => {
    if (user) {
      // Lưu thông tin user vào MySQL
      fetch('/api/user/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        })
      }).catch(err => {
      });
      
      // Lấy danh sách bộ từ vựng
      fetchVocabSets();
    } else {
      setVocabSets(null);
      setLoading(false);
    }
  }, [user]);

  // Thêm vào useEffect
  useEffect(() => {
    // Kiểm tra kết nối khi component mount
    checkDatabaseConnection();
    
    // Kiểm tra lại mỗi 5 phút
    const interval = setInterval(checkDatabaseConnection, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    vocabSets,
    loading,
    error,
    addVocabSet,
    updateVocabSet,
    deleteVocabSet,
    addTerm,
    updateTerm,
    deleteTerm,
    dbStatus,
    checkDatabaseConnection
  };

  return (
    <VocabContext.Provider value={value}>
      {children}
    </VocabContext.Provider>
  );
};

export const useVocab = () => {
  const context = useContext(VocabContext);
  if (context === undefined) {
    throw new Error('useVocab must be used within a VocabProvider');
  }
  return context;
};