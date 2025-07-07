import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchUserVocabSets,
  createNewVocabSet,
  updateVocabSetDetails,
  deleteVocabSetAndTerms,
  addTermToSet,
  updateExistingTerm,
  deleteExistingTerm
} from '../services/vocabService';
import { Term, VocabSet } from '../services/firebase/database';

export function useVocab() {
  const { user } = useAuth();
  const [vocabSets, setVocabSets] = useState<Record<string, VocabSet>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load vocabulary sets
  useEffect(() => {
    async function loadVocabSets() {
      if (!user) {
        setVocabSets({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const sets = await fetchUserVocabSets(user.uid);
        setVocabSets(sets);
        setError(null);
      } catch (err) {
        console.error('Error loading vocab sets:', err);
        setError('Failed to load vocabulary sets');
      } finally {
        setLoading(false);
      }
    }

    loadVocabSets();
  }, [user]);

  // Create a new vocabulary set
  const createSet = async (name: string, description: string = '') => {
    if (!user) {
      setError('User must be logged in');
      return null;
    }
    
    try {
      const newSet = await createNewVocabSet(user.uid, name, description);
      
      // Update local state
      setVocabSets(prev => ({
        ...prev,
        [newSet.id]: newSet
      }));
      
      return newSet;
    } catch (err) {
      console.error('Error creating vocab set:', err);
      setError('Failed to create vocabulary set');
      return null;
    }
  };

  // Update a vocabulary set
  const updateSet = async (setId: string, name: string, description: string = '') => {
    if (!user) {
      setError('User must be logged in');
      return false;
    }
    
    try {
      await updateVocabSetDetails(user.uid, setId, name, description);
      
      // Update local state
      setVocabSets(prev => {
        if (!prev[setId]) return prev;
        
        return {
          ...prev,
          [setId]: {
            ...prev[setId],
            name,
            description,
            updatedAt: new Date().toISOString()
          }
        };
      });
      
      return true;
    } catch (err) {
      console.error('Error updating vocab set:', err);
      setError('Failed to update vocabulary set');
      return false;
    }
  };

  // Delete a vocabulary set
  const deleteSet = async (setId: string) => {
    if (!user) {
      setError('User must be logged in');
      return false;
    }
    
    try {
      await deleteVocabSetAndTerms(user.uid, setId);
      
      // Update local state
      setVocabSets(prev => {
        const newSets = { ...prev };
        delete newSets[setId];
        return newSets;
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting vocab set:', err);
      setError('Failed to delete vocabulary set');
      return false;
    }
  };

  // Add a term to a set
  const addTerm = async (setId: string, vocab: string, meaning: string, part_of_speech?: string) => {
    if (!user) {
      setError('User must be logged in');
      return null;
    }
    
    try {
      const newTerm = await addTermToSet(user.uid, setId, vocab, meaning, part_of_speech);
      
      // Update local state
      setVocabSets(prev => {
        if (!prev[setId]) return prev;
        
        return {
          ...prev,
          [setId]: {
            ...prev[setId],
            terms: {
              ...prev[setId].terms,
              [newTerm.id]: newTerm
            },
            updatedAt: new Date().toISOString()
          }
        };
      });
      
      return newTerm;
    } catch (err) {
      console.error('Error adding term:', err);
      setError('Failed to add term');
      return null;
    }
  };

  // Update a term
  const updateTerm = async (setId: string, termId: string, termData: Partial<Term>) => {
    if (!user) {
      setError('User must be logged in');
      return false;
    }
    
    try {
      await updateExistingTerm(user.uid, setId, termId, termData);
      
      // Update local state
      setVocabSets(prev => {
        if (!prev[setId] || !prev[setId].terms[termId]) return prev;
        
        return {
          ...prev,
          [setId]: {
            ...prev[setId],
            terms: {
              ...prev[setId].terms,
              [termId]: {
                ...prev[setId].terms[termId],
                ...termData
              }
            },
            updatedAt: new Date().toISOString()
          }
        };
      });
      
      return true;
    } catch (err) {
      console.error('Error updating term:', err);
      setError('Failed to update term');
      return false;
    }
  };

  // Delete a term
  const deleteTerm = async (setId: string, termId: string) => {
    if (!user) {
      setError('User must be logged in');
      return false;
    }
    
    try {
      await deleteExistingTerm(user.uid, setId, termId);
      
      // Update local state
      setVocabSets(prev => {
        if (!prev[setId] || !prev[setId].terms[termId]) return prev;
        
        const newTerms = { ...prev[setId].terms };
        delete newTerms[termId];
        
        return {
          ...prev,
          [setId]: {
            ...prev[setId],
            terms: newTerms,
            updatedAt: new Date().toISOString()
          }
        };
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting term:', err);
      setError('Failed to delete term');
      return false;
    }
  };

  // Get all terms as a flat array
  const getAllTerms = (): Term[] => {
    const allTerms: Term[] = [];
    
    Object.entries(vocabSets).forEach(([setId, set]) => {
      if (set.terms) {
        Object.entries(set.terms).forEach(([termId, term]) => {
          allTerms.push({
            ...term,
            setId
          });
        });
      }
    });
    
    return allTerms;
  };

  // Reload vocabulary sets
  const reloadVocabSets = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const sets = await fetchUserVocabSets(user.uid);
      setVocabSets(sets);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error reloading vocab sets:', err);
      setError('Failed to reload vocabulary sets');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    vocabSets,
    loading,
    error,
    createSet,
    updateSet,
    deleteSet,
    addTerm,
    updateTerm,
    deleteTerm,
    getAllTerms,
    reloadVocabSets
  };
}
