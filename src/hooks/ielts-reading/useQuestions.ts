import { useState, useEffect, useCallback } from 'react';
import { Question, QuestionFormData, LoadingState } from '@/types/ielts-reading';
import { questionService } from '@/services/ielts-reading/questionService';
import { TOAST_MESSAGES } from '@/utils/ielts-reading/constants';

interface UseQuestionsReturn extends LoadingState {
  questions: Question[];
  questionGroups: any[];
  selectedQuestion: Question | null;
  fetchQuestions: (passageId: number) => Promise<void>;
  createQuestion: (passageId: number, data: QuestionFormData) => Promise<boolean>;
  updateQuestion: (id: number, data: QuestionFormData) => Promise<boolean>;
  deleteQuestion: (id: number) => Promise<boolean>;
  selectQuestion: (question: Question | null) => void;
  reorderQuestions: (passageId: number, questions: Array<{ id: number; order_index: number }>) => Promise<boolean>;
  bulkCreateQuestions: (passageId: number, questions: QuestionFormData[]) => Promise<boolean>;
  duplicateQuestion: (id: number) => Promise<boolean>;
  validateAnswers: (passageId: number, userAnswers: Record<string, string>) => Promise<any>;
}

export const useQuestions = (): UseQuestionsReturn => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionGroups, setQuestionGroups] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    // This would integrate with your toast system
    console.log(`${type.toUpperCase()}: ${message}`);
  }, []);

  const fetchQuestions = useCallback(async (passageId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await questionService.getQuestions(passageId);
      
      if (response.success && response.data) {
        const groups = response.data.groups || [];
        setQuestionGroups(groups);
        
        // Extract all questions from groups
        const allQuestions = groups.flatMap((group: any) => group.questions || []);
        setQuestions(allQuestions);
      } else {
        setError(response.error || 'Failed to fetch questions');
        showToast(response.error || TOAST_MESSAGES.ERROR.GENERIC, 'error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const createQuestion = useCallback(async (passageId: number, data: QuestionFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await questionService.createQuestion(passageId, data);
      
      if (response.success) {
        showToast(TOAST_MESSAGES.SUCCESS.QUESTION_CREATED);
        await fetchQuestions(passageId); // Refresh the list
        return true;
      } else {
        setError(response.error || 'Failed to create question');
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
  }, [fetchQuestions, showToast]);

  const updateQuestion = useCallback(async (id: number, data: QuestionFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await questionService.updateQuestion(id, data);
      
      if (response.success && response.data) {
        showToast(TOAST_MESSAGES.SUCCESS.QUESTION_UPDATED);
        
        // Update the question in the local state
        setQuestions(prev => prev.map(q => q.id === id ? response.data! : q));
        
        // Update selected question if it's the one being updated
        if (selectedQuestion?.id === id) {
          setSelectedQuestion(response.data);
        }
        
        return true;
      } else {
        setError(response.error || 'Failed to update question');
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
  }, [selectedQuestion, showToast]);

  const deleteQuestion = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await questionService.deleteQuestion(id);
      
      if (response.success) {
        showToast(TOAST_MESSAGES.SUCCESS.QUESTION_DELETED);
        
        // Remove the question from local state
        setQuestions(prev => prev.filter(q => q.id !== id));
        
        // Clear selection if deleted question was selected
        if (selectedQuestion?.id === id) {
          setSelectedQuestion(null);
        }
        
        return true;
      } else {
        setError(response.error || 'Failed to delete question');
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
  }, [selectedQuestion, showToast]);

  const selectQuestion = useCallback((question: Question | null) => {
    setSelectedQuestion(question);
  }, []);

  const reorderQuestions = useCallback(async (
    passageId: number, 
    questionsOrder: Array<{ id: number; order_index: number }>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await questionService.reorderQuestions(passageId, questionsOrder);
      
      if (response.success) {
        showToast('Questions reordered successfully');
        await fetchQuestions(passageId); // Refresh the list
        return true;
      } else {
        setError(response.error || 'Failed to reorder questions');
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
  }, [fetchQuestions, showToast]);

  const bulkCreateQuestions = useCallback(async (
    passageId: number, 
    questionsData: QuestionFormData[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await questionService.bulkCreateQuestions(passageId, questionsData);
      
      if (response.success) {
        showToast(`${questionsData.length} questions created successfully`);
        await fetchQuestions(passageId); // Refresh the list
        return true;
      } else {
        setError(response.error || 'Failed to create questions');
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
  }, [fetchQuestions, showToast]);

  const duplicateQuestion = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await questionService.duplicateQuestion(id);
      
      if (response.success && response.data) {
        showToast('Question duplicated successfully');
        
        // Add the new question to local state
        setQuestions(prev => [...prev, response.data!]);
        
        return true;
      } else {
        setError(response.error || 'Failed to duplicate question');
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
  }, [showToast]);

  const validateAnswers = useCallback(async (
    passageId: number, 
    userAnswers: Record<string, string>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await questionService.validateAnswers(passageId, userAnswers);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to validate answers');
        showToast(response.error || TOAST_MESSAGES.ERROR.GENERIC, 'error');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    questions,
    questionGroups,
    selectedQuestion,
    loading,
    error,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    selectQuestion,
    reorderQuestions,
    bulkCreateQuestions,
    duplicateQuestion,
    validateAnswers,
  };
};