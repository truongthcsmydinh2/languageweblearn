import { v4 as uuidv4 } from 'uuid';
import { 
  Term, 
  getLearningHistory, 
  updateLearningHistory 
} from './firebase/database';
import { 
  calculateMemoryStrength, 
  calculateNextReviewDate,
  evaluatePerformance 
} from '../utils/src';  
import { updateExistingTerm } from './vocabService';

// Interfaces
export interface ReviewResult {
  isCorrect: boolean;
  responseTime: number;
  performance: number;
}

export interface SessionStats {
  totalReviewed: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averagePerformance: number;
}

// Interface cho learning history
export interface LearningActivity {
  date: string;
  result: 'correct' | 'incorrect';
  responseTime: number;
  performance: number;
}

// Record a review for a term
export async function recordReview(
  userId: string,
  setId: string,
  termId: string,
  result: ReviewResult
): Promise<void> {
  // 1. Get current learning history
  const allHistory = await getLearningHistory(userId);
  const termHistory = allHistory[termId] || { 
    reviews: [], 
    averageAccuracy: 0 
  };
  
  // 2. Add new review to history
  const newReview = {
    date: new Date().toISOString(),
    result: result.isCorrect ? 'correct' : 'incorrect',
    responseTime: result.responseTime,
    performance: result.performance
  };
  
  const updatedReviews = [...termHistory.reviews || [], newReview];
  
  // 3. Calculate new average accuracy
  const correctCount = updatedReviews.filter(r => r.result === 'correct').length;
  const newAverageAccuracy = (correctCount / updatedReviews.length) * 100;
  
  // 4. Update history in database
  await updateLearningHistory(userId, termId, {
    reviews: updatedReviews,
    averageAccuracy: newAverageAccuracy
  });
  
  // 5. Update term's SRS data
  await updateTermSRSData(userId, setId, termId, result);
}

// Update a term's SRS data after review
async function updateTermSRSData(
  userId: string,
  setId: string,
  termId: string,
  result: ReviewResult
): Promise<void> {
  // Get current term data (to access current memory strength)
  const termData = await fetchTermData(userId, setId, termId);
  if (!termData) return;
  
  // Calculate new memory strength
  const currentStrength = termData.memoryStrength || 0;
  const newStrength = calculateMemoryStrength(currentStrength, result.performance);
  
  // Calculate next review date
  const nextReviewDate = calculateNextReviewDate(newStrength);
  
  // Update term with new SRS data
  await updateExistingTerm(userId, setId, termId, {
    memoryStrength: newStrength,
    lastReviewed: new Date().toISOString(),
    nextReviewDate: nextReviewDate.toISOString()
  });
}

// Helper function to fetch a single term
async function fetchTermData(
  userId: string, 
  setId: string, 
  termId: string
): Promise<Term | null> {
  // This would typically be implemented using a specific database query
  // For now, simplifying by returning a mock term
  return {
    id: termId,
    vocab: "example",
    meaning: "ví dụ",
    level: 0,
    memoryStrength: 0,
    lastReviewed: null,
    nextReviewDate: null
  };
}

// Prepare a learning session with smart selection of terms
export async function prepareLearningSession(
  terms: Term[],
  sessionOptions: {
    maxTerms: number;
    includeNewTerms: boolean;
    prioritizeDueTerms: boolean;
  }
): Promise<Term[]> {
  // Default options
  const options = {
    maxTerms: 10,
    includeNewTerms: true,
    prioritizeDueTerms: true,
    ...sessionOptions
  };
  
  // Filter and sort terms based on options
  let eligibleTerms = [...terms];
  
  // Filter out new terms if not included
  if (!options.includeNewTerms) {
    eligibleTerms = eligibleTerms.filter(term => term.lastReviewed !== null);
  }
  
  // Sort terms by priority
  eligibleTerms.sort((a, b) => {
    // New terms (never reviewed) have highest priority if included
    const aIsNew = a.lastReviewed === null;
    const bIsNew = b.lastReviewed === null;
    
    if (options.includeNewTerms) {
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
    }
    
    // Due terms have next priority if prioritized
    if (options.prioritizeDueTerms) {
      const aIsDue = isDue(a.nextReviewDate);
      const bIsDue = isDue(b.nextReviewDate);
      
      if (aIsDue && !bIsDue) return -1;
      if (!aIsDue && bIsDue) return 1;
    }
    
    // Sort by memory strength (weaker items first)
    const aStrength = a.memoryStrength || 0;
    const bStrength = b.memoryStrength || 0;
    return aStrength - bStrength;
  });
  
  // Limit to max terms
  return eligibleTerms.slice(0, options.maxTerms);
}

// Calculate session statistics
export function calculateSessionStats(
  results: ReviewResult[]
): SessionStats {
  if (results.length === 0) {
    return {
      totalReviewed: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      averagePerformance: 0
    };
  }
  
  const correctAnswers = results.filter(r => r.isCorrect).length;
  const incorrectAnswers = results.length - correctAnswers;
  const totalPerformance = results.reduce((sum, r) => sum + r.performance, 0);
  
  return {
    totalReviewed: results.length,
    correctAnswers,
    incorrectAnswers,
    averagePerformance: totalPerformance / results.length
  };
}

// Helper function for SRS implementation
function isDue(nextReviewDate: string | null): boolean {
  if (!nextReviewDate) return true;
  
  const now = new Date();
  const reviewDate = new Date(nextReviewDate);
  
  return now >= reviewDate;
}

// Hàm lấy toàn bộ lịch sử học tập
export async function getAllLearningHistory(userId: string): Promise<{ [termId: string]: LearningActivity[] }> {
  try {
    // Sử dụng hàm getLearningHistory có sẵn từ firebase/database
    const history = await getLearningHistory(userId);
    
    // Chuyển đổi dữ liệu để phù hợp với format mà LearningCalendar cần
    const formattedHistory: { [termId: string]: LearningActivity[] } = {};
    
    for (const [termId, data] of Object.entries(history)) {
      formattedHistory[termId] = data.reviews.map(review => ({
        date: review.date,
        result: review.result,
        responseTime: review.responseTime,
        performance: review.performance
      }));
    }
    
    return formattedHistory;
  } catch (error) {
    console.error('Error fetching learning history:', error);
    return {};
  }
}

export { getAllLearningHistory };
