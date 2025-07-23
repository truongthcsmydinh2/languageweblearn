import { useState, useEffect, useCallback } from 'react';
import { Passage, PassageFormData, LoadingState } from '@/types/ielts-reading';
import { passageService } from '@/services/ielts-reading/passageService';
import { TOAST_MESSAGES } from '@/utils/ielts-reading/constants';

interface UsePassagesReturn extends LoadingState {
  passages: Passage[];
  selectedPassage: Passage | null;
  groupedPassages: any;
  fetchPassages: () => Promise<void>;
  createPassage: (data: PassageFormData) => Promise<boolean>;
  updatePassage: (id: number, data: PassageFormData) => Promise<boolean>;
  deletePassage: (id: number) => Promise<boolean>;
  selectPassage: (passage: Passage | null) => void;
  togglePassageStatus: (id: number, is_active: boolean) => Promise<boolean>;
  duplicatePassage: (id: number) => Promise<boolean>;
}

export const usePassages = (): UsePassagesReturn => {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [groupedPassages, setGroupedPassages] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    // This would integrate with your toast system
    console.log(`${type.toUpperCase()}: ${message}`);
  }, []);

  const fetchPassages = useCallback(async () => {
    console.log('[usePassages] Fetching passages...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await passageService.getPassages();
      console.log('[usePassages] Fetch response:', response);
      
      if (response.success && response.data) {
        console.log('[usePassages] Successfully fetched', response.data.passages?.length || 0, 'passages');
        setPassages(response.data.passages || []);
        setGroupedPassages(response.data.groupedPassages || {});
      } else {
        console.error('[usePassages] Fetch failed:', response.error);
        setError(response.error || 'Failed to fetch passages');
        showToast(response.error || TOAST_MESSAGES.ERROR.GENERIC, 'error');
      }
    } catch (err) {
      console.error('[usePassages] Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const createPassage = useCallback(async (data: PassageFormData): Promise<boolean> => {
    console.log('[usePassages] Creating passage:', data.title);
    setLoading(true);
    setError(null);
    
    try {
      const response = await passageService.createPassage(data);
      console.log('[usePassages] Create response:', response);
      
      if (response.success) {
        console.log('[usePassages] Passage created successfully');
        showToast(TOAST_MESSAGES.SUCCESS.PASSAGE_CREATED);
        await fetchPassages(); // Refresh the list
        return true;
      } else {
        console.error('[usePassages] Create failed:', response.error);
        setError(response.error || 'Failed to create passage');
        showToast(response.error || TOAST_MESSAGES.ERROR.GENERIC, 'error');
        return false;
      }
    } catch (err) {
      console.error('[usePassages] Create error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPassages, showToast]);

  const updatePassage = useCallback(async (id: number, data: PassageFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await passageService.updatePassage(id, data);
      
      if (response.success) {
        showToast(TOAST_MESSAGES.SUCCESS.PASSAGE_UPDATED);
        await fetchPassages(); // Refresh the list
        return true;
      } else {
        setError(response.error || 'Failed to update passage');
        showToast(response.error || TOAST_MESSAGES.ERROR.GENERIC, 'error');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPassages, showToast]);

  const deletePassage = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await passageService.deletePassage(id);
      
      if (response.success) {
        showToast(TOAST_MESSAGES.SUCCESS.PASSAGE_DELETED);
        await fetchPassages(); // Refresh the list
        
        // Clear selection if deleted passage was selected
        if (selectedPassage?.id === id) {
          setSelectedPassage(null);
        }
        
        return true;
      } else {
        setError(response.error || 'Failed to delete passage');
        showToast(response.error || TOAST_MESSAGES.ERROR.GENERIC, 'error');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPassages, selectedPassage, showToast]);

  const selectPassage = useCallback((passage: Passage | null) => {
    setSelectedPassage(passage);
  }, []);

  const togglePassageStatus = useCallback(async (id: number, is_active: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await passageService.togglePassageStatus(id, is_active);
      
      if (response.success) {
        showToast(`Passage ${is_active ? 'activated' : 'deactivated'} successfully`);
        await fetchPassages(); // Refresh the list
        return true;
      } else {
        setError(response.error || 'Failed to toggle passage status');
        showToast(response.error || TOAST_MESSAGES.ERROR.GENERIC, 'error');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPassages, showToast]);

  const duplicatePassage = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await passageService.duplicatePassage(id);
      
      if (response.success) {
        showToast('Passage duplicated successfully');
        await fetchPassages(); // Refresh the list
        return true;
      } else {
        setError(response.error || 'Failed to duplicate passage');
        showToast(response.error || TOAST_MESSAGES.ERROR.GENERIC, 'error');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPassages, showToast]);

  // Auto-fetch passages on mount
  useEffect(() => {
    fetchPassages();
  }, [fetchPassages]);

  return {
    passages,
    selectedPassage,
    groupedPassages,
    loading,
    error,
    fetchPassages,
    createPassage,
    updatePassage,
    deletePassage,
    selectPassage,
    togglePassageStatus,
    duplicatePassage,
  };
};