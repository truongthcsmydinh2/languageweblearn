import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import StreamingText from '@/components/common/StreamingText';
import styles from '@/styles/TypingEffect.module.css';
import { safeJsonParse, formatFeedbackText, formatTextWithLineBreaks } from '@/utils/jsonUtils';

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
        let buffer = '';
        let currentEvaluation = {
          score: null as number | null,
          feedback: '',
          errors: '',
          suggestions: '',
          examples: [] as string[],
          correctAnswer: ''
        };

        if (reader) {
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
                const parsed = safeJsonParse(line);
                if (parsed) {
                  
                  if (parsed.e === 'start') {
                    // Bắt đầu streaming
                    setStreamingText('Đang nhận dữ liệu...');
                  } else if (parsed.e === 'data') {
                    // Xử lý dữ liệu streaming
                    if (parsed.k === 'score') {
                      currentEvaluation.score = parsed.v;
                      setStreamingText(`Điểm số: ${parsed.v}/100`);
                    } else if (parsed.k === 'feedback') {
                      if (parsed.c) {
                        currentEvaluation.feedback += (currentEvaluation.feedback ? ' ' : '') + parsed.c;
                        setStreamingText(`Phản hồi: ${currentEvaluation.feedback}`);
                      }
                    } else if (parsed.k === 'errors') {
                      if (parsed.c) {
                        currentEvaluation.errors += (currentEvaluation.errors ? ' ' : '') + parsed.c;
                        setStreamingText(`Lỗi: ${currentEvaluation.errors}`);
                      }
                    } else if (parsed.k === 'suggestions') {
                      if (parsed.c) {
                        currentEvaluation.suggestions += (currentEvaluation.suggestions ? ' ' : '') + parsed.c;
                        setStreamingText(`Gợi ý: ${currentEvaluation.suggestions}`);
                      }
                    } else if (parsed.k === 'correctAnswer') {
                      if (parsed.c) {
                        currentEvaluation.correctAnswer += (currentEvaluation.correctAnswer ? ' ' : '') + parsed.c;
                        setStreamingText(`Đáp án đúng: ${currentEvaluation.correctAnswer}`);
                      }
                    }
                    setChunkCount(prev => prev + 1);
                  } else if (parsed.e === 'end') {
                    // Kết thúc streaming
                    setEvaluationResult({
                      score: currentEvaluation.score || 0,
                      feedback: currentEvaluation.feedback,
                      errors: currentEvaluation.errors ? [currentEvaluation.errors] : [],
                      suggestions: currentEvaluation.suggestions ? [currentEvaluation.suggestions] : [],
                      examples: currentEvaluation.examples,
                      correctAnswer: currentEvaluation.correctAnswer
                    });
                    setIsStreaming(false);
                    setEvaluating(false);
                  }
                } else {
                  console.error('Error parsing JSON line:', 'Line:', line);
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
      // Sử dụng streaming cho chế độ translate
      try {
        setEvaluating(true);
        setIsStreaming(true);
        setChunkCount(0);
        setEvaluationResult(null);
        // Khởi tạo evaluationResult để hiển thị streaming
        setEvaluationResult({
          score: 0,
          feedback: '',
          errors: [],
          suggestions: [],
          examples: [],
          correctAnswer: ''
        });
        
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

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvaluation = {
          score: null as number | null,
          feedback: '',
          errors: '',
          suggestions: '',
          examples: [] as string[],
          correctAnswer: ''
        };

        if (reader) {
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
                const parsed = safeJsonParse(line);
                if (parsed) {
                  
                  if (parsed.e === 'start') {
                    // Bắt đầu streaming
                    console.log('Translation evaluation started');
                  } else if (parsed.e === 'data') {
                    // Xử lý dữ liệu streaming
                    if (parsed.k === 'score') {
                      currentEvaluation.score = parsed.v;
                      // Cập nhật UI ngay lập tức
                        setEvaluationResult(prev => ({
                          ...prev,
                          score: parsed.v,
                          feedback: currentEvaluation.feedback,
                          errors: currentEvaluation.errors ? [currentEvaluation.errors] : [],
                          suggestions: currentEvaluation.suggestions ? [currentEvaluation.suggestions] : [],
                          examples: currentEvaluation.examples,
                          correctAnswer: currentEvaluation.correctAnswer
                        }));
                    } else if (parsed.k === 'feedback') {
                      if (parsed.c) {
                        currentEvaluation.feedback += (currentEvaluation.feedback ? ' ' : '') + parsed.c;
                        // Cập nhật UI ngay lập tức
                        setEvaluationResult(prev => ({
                          ...prev,
                          score: currentEvaluation.score || 0,
                          feedback: currentEvaluation.feedback,
                          errors: currentEvaluation.errors ? [currentEvaluation.errors] : [],
                          suggestions: currentEvaluation.suggestions ? [currentEvaluation.suggestions] : [],
                          examples: currentEvaluation.examples,
                          correctAnswer: currentEvaluation.correctAnswer
                        }));
                      }
                    } else if (parsed.k === 'errors') {
                      if (parsed.c) {
                        currentEvaluation.errors += (currentEvaluation.errors ? ' ' : '') + parsed.c;
                        // Cập nhật UI ngay lập tức
                        setEvaluationResult(prev => ({
                          ...prev,
                          score: currentEvaluation.score || 0,
                          feedback: currentEvaluation.feedback,
                          errors: currentEvaluation.errors ? [currentEvaluation.errors] : [],
                          suggestions: currentEvaluation.suggestions ? [currentEvaluation.suggestions] : [],
                          examples: currentEvaluation.examples,
                          correctAnswer: currentEvaluation.correctAnswer
                        }));
                      }
                    } else if (parsed.k === 'suggestions') {
                      if (parsed.c) {
                        currentEvaluation.suggestions += (currentEvaluation.suggestions ? ' ' : '') + parsed.c;
                        // Cập nhật UI ngay lập tức
                        setEvaluationResult(prev => ({
                          ...prev,
                          score: currentEvaluation.score || 0,
                          feedback: currentEvaluation.feedback,
                          errors: currentEvaluation.errors ? [currentEvaluation.errors] : [],
                          suggestions: currentEvaluation.suggestions ? [currentEvaluation.suggestions] : [],
                          examples: currentEvaluation.examples,
                          correctAnswer: currentEvaluation.correctAnswer
                        }));
                      }
                    } else if (parsed.k === 'correctAnswer') {
                      if (parsed.c) {
                        currentEvaluation.correctAnswer += (currentEvaluation.correctAnswer ? ' ' : '') + parsed.c;
                        // Cập nhật UI ngay lập tức
                        setEvaluationResult(prev => ({
                          ...prev,
                          score: currentEvaluation.score || 0,
                          feedback: currentEvaluation.feedback,
                          errors: currentEvaluation.errors ? [currentEvaluation.errors] : [],
                          suggestions: currentEvaluation.suggestions ? [currentEvaluation.suggestions] : [],
                          examples: currentEvaluation.examples,
                          correctAnswer: currentEvaluation.correctAnswer
                        }));
                      }
                    }
                  } else if (parsed.e === 'end') {
                    // Kết thúc streaming
                    setEvaluationResult({
                      score: currentEvaluation.score || 0,
                      feedback: currentEvaluation.feedback,
                      errors: currentEvaluation.errors ? [currentEvaluation.errors] : [],
                      suggestions: currentEvaluation.suggestions ? [currentEvaluation.suggestions] : [],
                      examples: currentEvaluation.examples,
                      correctAnswer: currentEvaluation.correctAnswer
                    });
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error evaluating answer:', error);
        setIsStreaming(false);
        setEvaluating(false);
      } finally {
        // Đảm bảo dừng streaming trong mọi trường hợp
        setIsStreaming(false);
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
          
          {/* Hiển thị streaming text cho cả hai chế độ */}
          {isStreaming && (
            <div className={`mt-4 p-4 border rounded bg-gray-50 ${styles.streamingContainer}`}>
              <div className="flex items-center mb-2">
                <div className="text-sm font-medium text-gray-600">🤖 AI đang phân tích...</div>
                <div className="ml-2 text-xs text-gray-500">({chunkCount} chunks)</div>
              </div>
              {mode === 'custom' && (
                <StreamingText
                  text={streamingText}
                  speed={30}
                  showCursor={true}
                  enableSmoothing={true}
                  className={styles.typingEffect}
                />
              )}
              {mode === 'translate' && evaluationResult && (
                <div className="text-sm text-gray-800">
                  {evaluationResult.score > 0 && (
                    <div className="mb-2">
                      <strong>📊 Điểm:</strong> {evaluationResult.score}/100
                    </div>
                  )}
                  {evaluationResult.feedback && (
                    <div className="mb-2">
                      <strong>💬 Nhận xét:</strong>
                      <div className="whitespace-pre-line">
                        <StreamingText
                          text={formatTextWithLineBreaks(evaluationResult.feedback)}
                          speed={25}
                          showCursor={false}
                          enableSmoothing={true}
                          className={styles.typingEffect}
                        />
                      </div>
                    </div>
                  )}
                  {evaluationResult.correctAnswer && (
                    <div className="mb-2">
                      <strong>✅ Đáp án tham khảo:</strong>
                      <StreamingText
                        text={evaluationResult.correctAnswer}
                        speed={25}
                        showCursor={false}
                        enableSmoothing={true}
                        className={styles.typingEffect}
                      />
                    </div>
                  )}
                  {evaluationResult.errors && (
                    <div className="mb-2">
                      <strong>❌ Lỗi:</strong>
                      <div className="whitespace-pre-line">
                        <StreamingText
                          text={formatFeedbackText(Array.isArray(evaluationResult.errors) ? evaluationResult.errors.join(' ') : evaluationResult.errors)}
                          speed={25}
                          showCursor={false}
                          enableSmoothing={true}
                          className={styles.typingEffect}
                        />
                      </div>
                    </div>
                  )}
                  {evaluationResult.suggestions && (
                    <div className="mb-2">
                      <strong>💡 Gợi ý:</strong>
                      <div className="whitespace-pre-line">
                        <StreamingText
                          text={formatFeedbackText(Array.isArray(evaluationResult.suggestions) ? evaluationResult.suggestions.join(' ') : evaluationResult.suggestions)}
                          speed={25}
                          showCursor={false}
                          enableSmoothing={true}
                          className={styles.typingEffect}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
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
              <h3 className="font-bold text-2xl mb-2">💬 Nhận xét:</h3>
              <div className="whitespace-pre-line">
                <StreamingText
                  text={formatTextWithLineBreaks(evaluationResult.feedback)}
                  speed={20}
                  showCursor={false}
                  enableSmoothing={true}
                  className="text-xl font-bold"
                />
              </div>
            </div>
            
            {evaluationResult.errors && (
              <div className="mb-4">
                <h3 className="font-bold text-2xl mb-2">❌ Lỗi:</h3>
                <div className="whitespace-pre-line">
                  <StreamingText
                    text={formatFeedbackText(Array.isArray(evaluationResult.errors) ? evaluationResult.errors.join(' ') : evaluationResult.errors)}
                    speed={20}
                    showCursor={false}
                    enableSmoothing={true}
                    className="text-red-600 text-xl font-bold"
                  />
                </div>
              </div>
            )}
            
            {evaluationResult.suggestions && (
              <div className="mb-4">
                <h3 className="font-bold text-2xl mb-2">💡 Gợi ý:</h3>
                <div className="whitespace-pre-line">
                  <StreamingText
                    text={formatFeedbackText(Array.isArray(evaluationResult.suggestions) ? evaluationResult.suggestions.join(' ') : evaluationResult.suggestions)}
                    speed={20}
                    showCursor={false}
                    enableSmoothing={true}
                    className="text-green-600 text-xl font-bold"
                  />
                </div>
              </div>
            )}
            
            {mode === 'translate' && evaluationResult.correctAnswer && (
              <div className="mb-4">
                <h3 className="font-bold text-2xl mb-2">✅ Câu dịch tham khảo:</h3>
                <StreamingText
                  text={evaluationResult.correctAnswer}
                  speed={20}
                  showCursor={false}
                  enableSmoothing={true}
                  className="p-2 text-2xl font-bold rounded"
                />
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