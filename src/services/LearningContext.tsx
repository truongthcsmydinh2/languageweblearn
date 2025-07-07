import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Term } from '../services/firebase/database';
import { getDueTerms } from '../services/vocabService';
import { 
  prepareLearningSession, 
  recordReview,
  ReviewResult,
  calculateSessionStats,
  SessionStats
} from '../services/learningService';

// Interfaces
export type LearningMode = 'flashcard' | 'quiz' | 'writing';

export interface LearningOptions {
  maxTerms: number;
  learningModes: LearningMode[];
  includeNewTerms: boolean;
  prioritizeDueTerms: boolean;
}

interface LearningContextType {
  // Session state
  currentTerm: Term | null;
  currentMode: LearningMode;
  sessionTerms: Term[];
  currentIndex: number;
  sessionComplete: boolean;
  sessionStats: SessionStats;
  
  // Session options
  options: LearningOptions;
  setOptions: React.Dispatch<React.SetStateAction<LearningOptions>>;
  
  // Actions
  startSession: () => Promise<boolean>;
  recordAnswer: (result: ReviewResult) => Promise<void>;
  moveToNextTerm: () => boolean;
  skipTerm: () => void;
  restartSession: () => Promise<boolean>;
  
  // Status
  loading: boolean;
  error: string | null;
}

const defaultOptions: LearningOptions = {
  maxTerms: 10,
  learningModes: ['flashcard', 'quiz', 'writing'],
  includeNewTerms: true,
  prioritizeDueTerms: true
};

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Session state
  const [sessionTerms, setSessionTerms] = useState<Term[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<LearningMode>('flashcard');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [options, setOptions] = useState<LearningOptions>(defaultOptions);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalReviewed: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    averagePerformance: 0
  });
  
  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Computed current term
  const currentTerm = sessionTerms[currentIndex] || null;
  
  // Start a new learning session
  const startSession = async (): Promise<boolean> => {
    if (!user) {
      setError('User must be logged in to start a session');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get due terms
      const allDueTerms = await getDueTerms(user.uid);
      
      if (allDueTerms.length === 0) {
        setError('No terms available for review');
        return false;
      }
      
      // Prepare session with selected terms
      const selectedTerms = await prepareLearningSession(allDueTerms, {
        maxTerms: options.maxTerms,
        includeNewTerms: options.includeNewTerms,
        prioritizeDueTerms: options.prioritizeDueTerms
      });
      
      // Reset session state
      setSessionTerms(selectedTerms);
      setCurrentIndex(0);
      setCurrentMode(options.learningModes[0] || 'flashcard');
      setSessionComplete(false);
      setResults([]);
      setSessionStats({
        totalReviewed: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        averagePerformance: 0
      });
      
      return true;
    } catch (err) {
      setError(`Failed to start session: ${err}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Record an answer and move to next mode or term
  const recordAnswer = async (result: ReviewResult): Promise<void> => {
    if (!user || !currentTerm) return;
    
    try {
      setLoading(true);
      
      // Record review in database
      await recordReview(
        user.uid,
        currentTerm.setId || '',
        currentTerm.id,
        result
      );
      
      // Update local results
      const updatedResults = [...results, result];
      setResults(updatedResults);
      
      // Update stats
      setSessionStats(calculateSessionStats(updatedResults));
      
      // Move to next mode or term
      const currentModeIndex = options.learningModes.indexOf(currentMode);
      const isLastMode = currentModeIndex >= options.learningModes.length - 1;
      
      if (isLastMode) {
        // If it's the last mode, move to next term
        moveToNextTerm();
      } else {
        // Otherwise, move to next mode for current term
        setCurrentMode(options.learningModes[currentModeIndex + 1]);
      }
    } catch (err) {
      setError(`Failed to record answer: ${err}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Move to the next term
  const moveToNextTerm = (): boolean => {
    if (currentIndex >= sessionTerms.length - 1) {
      setSessionComplete(true);
      return false;
    }
    
    setCurrentIndex(currentIndex + 1);
    setCurrentMode(options.learningModes[0] || 'flashcard');
    return true;
  };
  
  // Skip current term
  const skipTerm = () => {
    moveToNextTerm();
  };
  
  // Restart session
  const restartSession = async (): Promise<boolean> => {
    return startSession();
  };
  
  // Provide the context value
  const value = {
    // Session state
    currentTerm,
    currentMode,
    sessionTerms,
    currentIndex,
    sessionComplete,
    sessionStats,
    
    // Session options
    options,
    setOptions,
    
    // Actions
    startSession,
    recordAnswer,
    moveToNextTerm,
    skipTerm,
    restartSession,
    
    // Status
    loading,
    error
  };
  
  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

// Custom hook to use the learning context
export function useLearning() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}
