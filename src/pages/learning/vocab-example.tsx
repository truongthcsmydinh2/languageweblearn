import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
}

interface EvaluationResult {
  score: number;
  feedback: string;
  errors: string[];
  suggestions: string[];
  correctAnswer?: string;
  examples?: string[];
}

const VocabExamplePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [mode, setMode] = useState<'translate' | 'custom'>('translate');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [chunkCount, setChunkCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [wordCount, setWordCount] = useState(10);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  
  // useEffect để xử lý query params và fetch data
  useEffect(() => {
    console.log('useEffect triggered:', { 
      user: !!user, 
      isReady: router.isReady, 
      query: router.query, 
      pathname: router.pathname 
    }); // Debug log
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Chỉ xử lý query params khi router đã sẵn sàng
    if (!router.isReady) {
      console.log('Router not ready, skipping');
      return;
    }

    let newWordCount = 10; // Default value
    let newSelectedWords: string[] = [];
    
    // Lấy số lượng từ vựng từ query params nếu có
    if (router.query.count) {
      const count = parseInt(router.query.count as string, 10);
      if (!isNaN(count) && count > 0) {
        newWordCount = count;
        setWordCount(count);
      }
    }

    // Lấy danh sách từ vựng cụ thể nếu có
    if (router.query.words) {
      const words = (router.query.words as string).split(',');
      if (words.length > 0) {
        newSelectedWords = words;
        setSelectedWords(words);
      }
    }

    console.log('About to fetch with params:', { count: newWordCount, words: newSelectedWords });
    
    // Tạo AbortController để có thể hủy request
    const abortController = new AbortController();
    
    // Fetch data với các tham số đã xác định
    fetchWordsWithParams(newWordCount, newSelectedWords, abortController.signal);
    
    // Cleanup function
    return () => {
      console.log('useEffect cleanup called');
      abortController.abort();
    };
  }, [user, router.isReady, router.query.count, router.query.words]); // Chỉ re-run khi count hoặc words thay đổi

  const fetchWordsWithParams = async (count: number, selectedWordsList: string[], abortSignal?: AbortSignal) => {
    try {
      setLoading(true);
      
      // Xây dựng URL với các tham số
      let url = `/api/learning/example/init?count=${count}`;
      if (selectedWordsList.length > 0) {
        url += `&words=${selectedWordsList.join(',')}`;
      }
      
      console.log('Fetching words with URL:', url); // Debug log
      
      const response = await fetch(url, {
        headers: {
          'firebase_uid': user?.uid || ''
        },
        signal: abortSignal
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Kiểm tra nếu request đã bị hủy
        if (abortSignal?.aborted) {
          console.log('Request was aborted, not updating state');
          return;
        }
        
        setWords(data.words);
        // Cập nhật tiến độ
        setProgress(0);
      } else {
        console.error('Error fetching words:', await response.text());
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      console.error('Error fetching words:', error);
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  };

  const fetchWords = async () => {
    return fetchWordsWithParams(wordCount, selectedWords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const currentWord = words[currentWordIndex];
    
    if (mode === 'custom') {
      // Sử dụng streaming cho chế độ custom
      try {
        setIsStreaming(true);
        setStreamingText('');
        setChunkCount(0);
        setEvaluationResult(null);
        
        const response = await fetch('/api/learning/example/evaluate-custom-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'firebase_uid': user?.uid || '',
          },
          body: JSON.stringify({
            word: currentWord.word,
            meaning: currentWord.meaning,
            userAnswer,
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  setIsStreaming(false);
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === 'chunk') {
                    setStreamingText(parsed.accumulated);
                    setChunkCount(parsed.chunkNumber);
                  } else if (parsed.type === 'complete') {
                    setEvaluationResult(parsed.result);
                    setIsStreaming(false);
                  } else if (parsed.type === 'error') {
                    console.error('Streaming error:', parsed.message);
                    setIsStreaming(false);
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in streaming evaluation:', error);
        setIsStreaming(false);
      }
    } else {
      // Sử dụng API thông thường cho chế độ translate
      try {
        setEvaluating(true);
        
        const response = await fetch('/api/learning/example/evaluate-translation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'firebase_uid': user?.uid || ''
          },
          body: JSON.stringify({
            word: currentWord.word,
            meaning: currentWord.meaning,
            example: currentWord.example,
            userAnswer,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setEvaluationResult(result);
        } else {
          console.error('Error evaluating answer:', await response.text());
        }
      } catch (error) {
        console.error('Error evaluating answer:', error);
      } finally {
        setEvaluating(false);
      }
    }
  };

  const handleNext = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setUserAnswer('');
      setEvaluationResult(null);
      // Cập nhật tiến độ
      setProgress(((currentWordIndex + 1) / words.length) * 100);
      // Focus vào ô nhập liệu
      setTimeout(() => {
        answerInputRef.current?.focus();
      }, 100);
    } else {
      // Hoàn thành bài học
      router.push('/learning');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'translate' ? 'custom' : 'translate');
    setUserAnswer('');
    setEvaluationResult(null);
    // Focus vào ô nhập liệu
    setTimeout(() => {
      answerInputRef.current?.focus();
    }, 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Học từ vựng qua ví dụ</h1>
        <div className="bg-gray-700 rounded-lg shadow p-6">
          <p className="text-center text-lg">Không có từ vựng nào để học. Vui lòng thêm từ vựng vào hệ thống.</p>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => router.push('/vocab/add')}
              className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
            >
              Thêm từ vựng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = words[currentWordIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Học từ vựng qua ví dụ</h1>
      
      {/* Thanh tiến độ */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div 
          className="bg-primary-500 h-2.5 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="bg-gray-700 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-sm text-gray-500">Từ {currentWordIndex + 1}/{words.length}</span>
          </div>
          <button
            onClick={toggleMode}
            className="text-primary-500 hover:text-primary-700 text-sm"
          >
            {mode === 'translate' ? 'Chuyển sang chế độ tự đặt câu' : 'Chuyển sang chế độ dịch câu'}
          </button>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary-600">{currentWord.word}</h2>
          <p className="text-gray-600">{currentWord.meaning}</p>
        </div>
        
        {mode === 'translate' ? (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Câu ví dụ:</h3>
            <p className="p-3 bg-gray-700 rounded">{currentWord.example}</p>
          </div>
        ) : (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Hãy đặt một câu tiếng Anh sử dụng từ vựng này:</h3>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="answer" className="block font-medium mb-2">
              {mode === 'translate' ? 'Dịch câu trên sang tiếng Anh:' : 'Câu của bạn:'}
            </label>
            <textarea
              id="answer"
              ref={answerInputRef}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full p-2 border border-gray-300 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              disabled={!!evaluationResult}
              placeholder={mode === 'translate' ? 'Nhập bản dịch của bạn...' : 'Nhập câu của bạn...'}
            />
          </div>
          
          {!evaluationResult && (
            <button
              type="submit"
              className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 disabled:bg-gray-400"
              disabled={evaluating || isStreaming || !userAnswer.trim()}
            >
              {evaluating ? 'Đang đánh giá...' : isStreaming ? `Đang streaming... (${chunkCount} chunks)` : 'Kiểm tra'}
            </button>
          )}
          
          {/* Hiển thị streaming text cho chế độ custom */}
          {mode === 'custom' && isStreaming && (
            <div className="mt-4 p-4 border rounded bg-gray-50">
              <div className="flex items-center mb-2">
                <div className="text-sm font-medium text-gray-600">Đang nhận phản hồi từ AI...</div>
                <div className="ml-2 text-xs text-gray-500">({chunkCount} chunks)</div>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {streamingText}
                <span className="animate-pulse">|</span>
              </div>
            </div>
          )}
        </form>
        
        {evaluationResult && (
          <div className="mt-6 p-4 border rounded">
            <div className="flex items-center mb-4">
              <div className="text-xl font-bold mr-2">Điểm: {evaluationResult.score}/100</div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div 
                  className={`h-2 rounded-full ${getScoreColor(evaluationResult.score)}`}
                  style={{ width: `${evaluationResult.score}%` }}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-bold text-2xl mb-2">Nhận xét:</h3>
              <p className="text-xl font-bold">{evaluationResult.feedback}</p>
            </div>
            
            {evaluationResult.errors.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-2xl mb-2">Lỗi:</h3>
                <ul className="list-disc pl-5">
                  {evaluationResult.errors.map((error, index) => (
                    <li key={index} className="text-red-600 text-xl font-bold">{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {evaluationResult.suggestions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-2xl mb-2">Gợi ý:</h3>
                <ul className="list-disc pl-5">
                  {evaluationResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-green-600 text-xl font-bold">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {mode === 'translate' && evaluationResult.correctAnswer && (
              <div className="mb-4">
                <h3 className="font-bold text-2xl mb-2">Câu dịch tham khảo:</h3>
                <p className="p-2 text-2xl font-bold rounded">{evaluationResult.correctAnswer}</p>
              </div>
            )}
            
            {mode === 'custom' && evaluationResult.examples && evaluationResult.examples.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Ví dụ tham khảo:</h3>
                <ul className="list-disc pl-5">
                  {evaluationResult.examples.map((example, index) => (
                    <li key={index} className="p-2 bg-gray-100 rounded mt-2">{example}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              onClick={handleNext}
              className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 mt-4"
            >
              {currentWordIndex < words.length - 1 ? 'Tiếp tục' : 'Hoàn thành'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabExamplePage;