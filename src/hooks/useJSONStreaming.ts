import { useState, useCallback } from 'react';
import { safeJsonParse } from '@/utils/jsonUtils';

interface UseJSONStreamingOptions {
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  validateData?: (data: any) => boolean;
}

interface UseJSONStreamingReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  startStream: (url: string, payload?: any) => Promise<void>;
  resetData: () => void;
}

/**
 * Custom hook để xử lý JSON streaming với skeleton loading
 * 
 * @param options - Các tùy chọn cho streaming
 * @returns Object chứa data, loading state và các functions
 * 
 * @example
 * ```tsx
 * const { data, loading, startStream } = useJSONStreaming<VocabItem>({
 *   validateData: (item) => item.word && item.meaning,
 *   onError: (error) => console.error('Streaming error:', error)
 * });
 * 
 * // Bắt đầu streaming
 * await startStream('/api/stream-vocab', { topic: 'technology' });
 * ```
 */
export function useJSONStreaming<T = any>(options: UseJSONStreamingOptions = {}): UseJSONStreamingReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onData, onError, onComplete, validateData } = options;

  const startStream = useCallback(async (url: string, payload?: any) => {
    setData([]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body available for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Xử lý từng dòng JSON hoàn chỉnh
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.substring(0, newlineIndex).trim();
          buffer = buffer.substring(newlineIndex + 1);

          if (line && !line.startsWith('```')) {
            const parsedData = safeJsonParse(line);
            if (parsedData) {
              
              // Kiểm tra nếu là format event-based mới
              if (parsedData.e) {
                // Xử lý format event-based: {"e": "data", "k": "field", "v": value, "c": content}
                if (parsedData.e === 'data' && onData) {
                  onData(parsedData);
                }
                // Không thêm vào data array cho format event-based
                continue;
              }
              
              // Xử lý format cũ (legacy)
              // Validate dữ liệu nếu có function validate
              if (validateData && !validateData(parsedData)) {
                console.warn('Invalid data received:', parsedData);
                continue;
              }
              
              // Thêm vào state cho format cũ
              setData(prev => [...prev, parsedData]);
              
              // Gọi callback nếu có
              if (onData) {
                onData(parsedData);
              }
            } else {
              console.warn('Invalid JSON line, skipping:', line);
            }
          }
        }
      }
      
      // Xử lý phần còn lại trong buffer (nếu có)
      if (buffer.trim()) {
        const parsedData: T = safeJsonParse(buffer.trim());
        if (parsedData) {
          if (!validateData || validateData(parsedData)) {
            setData(prev => [...prev, parsedData]);
            if (onData) {
              onData(parsedData);
            }
          }
        } else {
          console.warn('Invalid JSON in final buffer:', buffer);
        }
      }
      
      if (onComplete) {
        onComplete();
      }
    } catch (streamError) {
      const errorMessage = streamError instanceof Error ? streamError.message : 'Unknown streaming error';
      setError(errorMessage);
      
      if (onError) {
        onError(streamError instanceof Error ? streamError : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  }, [onData, onError, onComplete, validateData]);

  const resetData = useCallback(() => {
    setData([]);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    startStream,
    resetData
  };
}

/**
 * Hook chuyên biệt cho streaming vocabulary items
 */
export function useVocabStreaming() {
  return useJSONStreaming<{
    id: number;
    word: string;
    pronunciation: string;
    partOfSpeech: string;
    meaning: string;
    example: string;
    exampleTranslation: string;
    difficulty: number;
    synonyms: string[];
  }>({
    validateData: (item) => {
      return !!(item.word && item.meaning && item.example);
    },
    onError: (error) => {
      console.error('Vocab streaming error:', error);
    }
  });
}

/**
 * Hook chuyên biệt cho streaming product items
 */
export function useProductStreaming() {
  return useJSONStreaming<{
    id: number;
    tenSP: string;
    moTaNgan: string;
    gia: string;
    urlHinhAnh: string;
  }>({
    validateData: (item) => {
      return !!(item.tenSP && item.gia);
    },
    onError: (error) => {
      console.error('Product streaming error:', error);
    }
  });
}

/**
 * Utility function để tạo skeleton array
 */
export function createSkeletonArray(count: number): null[] {
  return Array.from({ length: count }, () => null);
}

/**
 * Utility function để tính toán số skeleton cần hiển thị
 */
export function getSkeletonCount(totalExpected: number, currentLoaded: number, isLoading: boolean): number {
  if (!isLoading) return 0;
  return Math.max(0, totalExpected - currentLoaded);
}