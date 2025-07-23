import { Question, QuestionFormData, ApiResponse } from '@/types/ielts-reading';
import { API_ENDPOINTS } from '@/utils/ielts-reading/constants';

class QuestionService {
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getQuestions(passageId: number): Promise<ApiResponse<{
    questions?: Question[];
    groups?: any[];
  }>> {
    return this.makeRequest(`${API_ENDPOINTS.QUESTIONS}/${passageId}`);
  }

  async getQuestion(id: number): Promise<ApiResponse<Question>> {
    return this.makeRequest(`${API_ENDPOINTS.QUESTIONS}/single/${id}`);
  }

  async createQuestion(
    passageId: number,
    data: QuestionFormData
  ): Promise<ApiResponse<Question>> {
    return this.makeRequest(API_ENDPOINTS.QUESTIONS, {
      method: 'POST',
      body: JSON.stringify({ ...data, passage_id: passageId }),
    });
  }

  async updateQuestion(
    id: number,
    data: QuestionFormData
  ): Promise<ApiResponse<Question>> {
    return this.makeRequest(`${API_ENDPOINTS.QUESTIONS}/single/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(id: number): Promise<ApiResponse<void>> {
    return this.makeRequest(`${API_ENDPOINTS.QUESTIONS}/single/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderQuestions(
    passageId: number,
    questions: Array<{ id: number; order_index: number }>
  ): Promise<ApiResponse<void>> {
    return this.makeRequest(`${API_ENDPOINTS.QUESTIONS}/${passageId}`, {
      method: 'PUT',
      body: JSON.stringify({ questions }),
    });
  }

  async bulkCreateQuestions(
    passageId: number,
    questions: QuestionFormData[]
  ): Promise<ApiResponse<Question[]>> {
    return this.makeRequest(`${API_ENDPOINTS.QUESTIONS}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ passage_id: passageId, questions }),
    });
  }

  async bulkUpdateAnswers(
    passageId: number,
    answers: Array<{
      question_number: string;
      answer: string;
      explanation?: string;
      order_index: number;
    }>
  ): Promise<ApiResponse<void>> {
    return this.makeRequest(`${API_ENDPOINTS.QUESTIONS}/${passageId}/bulk-answers`, {
      method: 'PUT',
      body: JSON.stringify({ answers }),
    });
  }

  async duplicateQuestion(id: number): Promise<ApiResponse<Question>> {
    return this.makeRequest(`${API_ENDPOINTS.QUESTIONS}/single/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async validateAnswers(
    passageId: number,
    userAnswers: Record<string, string>
  ): Promise<ApiResponse<{
    score: number;
    total: number;
    results: Array<{
      question_id: number;
      correct: boolean;
      user_answer: string;
      correct_answer: string;
    }>;
  }>> {
    return this.makeRequest(`${API_ENDPOINTS.QUESTIONS}/${passageId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ answers: userAnswers }),
    });
  }

  async getQuestionStats(passageId: number): Promise<ApiResponse<{
    total_questions: number;
    by_type: Record<string, number>;
    difficulty_distribution: Record<string, number>;
    average_completion_time: number;
  }>> {
    return this.makeRequest(`${API_ENDPOINTS.QUESTIONS}/${passageId}/stats`);
  }
}

export const questionService = new QuestionService();
export default questionService;