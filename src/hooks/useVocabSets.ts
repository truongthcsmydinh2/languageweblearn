import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseService } from '@/services/databaseService';

// Dữ liệu mẫu cho phát triển
const MOCK_VOCAB_SETS = [
  {
    id: 'set1',
    name: 'Basic Vocabulary',
    description: 'Essential words for beginners',
    userId: 'any-user-id',
    terms: [
      { vocab: 'profound', meaning: 'sâu sắc', level: 1, timeAdded: Date.now(), reviewTime: Date.now() + 86400000 },
      { vocab: 'tragic', meaning: 'bi thảm', level: 2, timeAdded: Date.now() - 86400000, reviewTime: Date.now() + 172800000 },
      { vocab: 'genius', meaning: 'thiên tài', level: 3, timeAdded: Date.now() - 172800000, reviewTime: Date.now() + 259200000 },
      { vocab: 'pen', meaning: 'cây bút', level: 0, timeAdded: Date.now() - 259200000, reviewTime: Date.now() }
    ]
  }
];

export function useVocabSets() {
  const [vocabSets, setVocabSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadVocabSets() {
      if (!user) return;

      try {
        setLoading(true);
        const data = await DatabaseService.getAllVocabSets(user.uid);
        setVocabSets(data);
      } catch (err) {
        console.error('Error loading vocab sets:', err);
        setError(err instanceof Error ? err.message : 'Error loading vocab sets');
      } finally {
        setLoading(false);
      }
    }

    loadVocabSets();
  }, [user]);

  return { vocabSets, loading, error, setVocabSets };
} 