import { Passage, PassageFormData, ApiResponse } from '@/types/ielts-reading';
import { API_ENDPOINTS } from '@/utils/ielts-reading/constants';
import { auth } from '@/firebase/config';

class PassageService {
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    console.log('[PassageService] Making request to:', url, 'with options:', options);
    
    try {
      // Get current user's UID for authentication
      const currentUser = auth.currentUser;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };
      
      if (currentUser) {
        headers['firebase_uid'] = currentUser.uid;
      }
      
      const response = await fetch(url, {
        headers,
        ...options,
      });

      console.log('[PassageService] Response status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('[PassageService] Response data:', data);

      if (!response.ok) {
        console.error('[PassageService] Request failed:', data.message || `HTTP ${response.status}`);
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      console.log('[PassageService] Request successful');
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[PassageService] Request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getPassages(): Promise<ApiResponse<{ passages: Passage[]; groupedPassages: any }>> {
    console.log('[PassageService] Getting all passages');
    return this.makeRequest(API_ENDPOINTS.PASSAGES);
  }

  async getPassage(id: number): Promise<ApiResponse<Passage>> {
    return this.makeRequest(`${API_ENDPOINTS.PASSAGES}/${id}`);
  }

  async createPassage(data: PassageFormData): Promise<ApiResponse<Passage>> {
    console.log('[PassageService] Creating passage:', data.title);
    return this.makeRequest(API_ENDPOINTS.PASSAGES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePassage(id: number, data: PassageFormData): Promise<ApiResponse<Passage>> {
    return this.makeRequest(`${API_ENDPOINTS.PASSAGES}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePassage(id: number): Promise<ApiResponse<void>> {
    return this.makeRequest(`${API_ENDPOINTS.PASSAGES}/${id}`, {
      method: 'DELETE',
    });
  }

  async createPassageWithQuestions(data: {
    title: string;
    content: string;
    is_active: boolean;
    questions: any[];
  }): Promise<ApiResponse<Passage>> {
    console.log('[PassageService] Creating passage with questions:', data.title, 'with', data.questions.length, 'questions');
    return this.makeRequest(`${API_ENDPOINTS.PASSAGES}-with-questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async togglePassageStatus(id: number, is_active: boolean): Promise<ApiResponse<Passage>> {
    return this.makeRequest(`${API_ENDPOINTS.PASSAGES}/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
  }

  async duplicatePassage(id: number): Promise<ApiResponse<Passage>> {
    return this.makeRequest(`${API_ENDPOINTS.PASSAGES}/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async getPassageStats(id: number): Promise<ApiResponse<{
    total_questions: number;
    question_types: string[];
    completion_rate: number;
    average_score: number;
  }>> {
    return this.makeRequest(`${API_ENDPOINTS.PASSAGES}/${id}/stats`);
  }
}

export const passageService = new PassageService();
export default passageService;