import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import StreamingText from '@/components/common/StreamingText';
import styles from '@/styles/TypingEffect.module.css';
import { safeJsonParse } from '@/utils/jsonUtils';

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

const ExampleLearningPage = () => {
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
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Lấy danh sách từ vựng và ví dụ
    const fetchWords = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/learning/example/init', {
          headers: {
            'firebase_uid': user.uid
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setWords(data.words);
        } else {
          console.error('Error fetching words:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching words:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [user?.uid]);

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
          errors: [] as string[],
          suggestions: [] as string[],
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
                        // Thêm khoảng trắng giữa các từ nếu đã có nội dung
                        const separator = currentEvaluation.feedback && !currentEvaluation.feedback.endsWith(' ') ? ' ' : '';
                        currentEvaluation.feedback += separator + parsed.c;
                        setStreamingText(`Phản hồi: ${currentEvaluation.feedback}`);
                      }
                    } else if (parsed.k === 'errors') {
                      if (parsed.c) {
                        // Xử lý errors như một chuỗi liên tục
                        const currentErrors = currentEvaluation.errors;
                const separator = currentErrors && !currentErrors.endsWith(' ') ? ' ' : '';
                const newErrorText = currentErrors + separator + parsed.c;
                currentEvaluation.errors = newErrorText;
                setStreamingText(`Lỗi: ${currentEvaluation.errors}`);
                      }
                    } else if (parsed.k === 'suggestions') {
                      if (parsed.c) {
                        // Xử lý suggestions như một chuỗi liên tục
                        const currentSuggestions = currentEvaluation.suggestions;
                const separator = currentSuggestions && !currentSuggestions.endsWith(' ') ? ' ' : '';
                const newSuggestionText = currentSuggestions + separator + parsed.c;
                currentEvaluation.suggestions = newSuggestionText;
                setStreamingText(`Gợi ý: ${currentEvaluation.suggestions}`);
                      }
                    } else if (parsed.k === 'correctAnswer') {
                      if (parsed.c) {
                        // Thêm khoảng trắng giữa các từ nếu đã có nội dung
                        const separator = currentEvaluation.correctAnswer && !currentEvaluation.correctAnswer.endsWith(' ') ? ' ' : '';
                        currentEvaluation.correctAnswer += separator + parsed.c;
                        setStreamingText(`Đáp án đúng: ${currentEvaluation.correctAnswer}`);
                      }
                    }
                    setChunkCount(prev => prev + 1);
                  } else if (parsed.e === 'end') {
                    // Kết thúc streaming
                    setEvaluationResult({
                      score: currentEvaluation.score || 0,
                      feedback: currentEvaluation.feedback,
                      errors: currentEvaluation.errors,
                      suggestions: currentEvaluation.suggestions,
                      examples: currentEvaluation.examples,
                      correctAnswer: currentEvaluation.correctAnswer
                    });
                    setIsStreaming(false);
                  }
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
      // Sử dụng streaming JSONL cho chế độ translate
      try {
        setEvaluating(true);
        setIsStreaming(true);
        setChunkCount(0);
        setStreamingText('');
        // Khởi tạo evaluationResult để hiển thị streaming
        setEvaluationResult({
          score: 0,
          feedback: '',
          errors: [],
          suggestions: [],
          correctAnswer: ''
        });
        
        const response = await fetch('/api/learning/example/evaluate-translation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'firebase_uid': user?.uid || '',
          },
          body: JSON.stringify({
            word: currentWord.word,
            meaning: currentWord.meaning,
            example: currentWord.example,
            userAnswer,
          }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let tempResult = {
            score: 0,
            feedback: '',
            errors: [],
            suggestions: [],
            correctAnswer: ''
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim()) {
                setChunkCount(prev => prev + 1);
                const data = safeJsonParse(line);
                if (data) {
                  
                  if (data.e === 'start') {
                     console.log('Streaming started');
                   } else if (data.e === 'data') {
                     if (data.k === 'score') {
                       tempResult.score = data.v;
                       // Cập nhật UI ngay lập tức
                       setEvaluationResult({...tempResult});
                     } else if (data.k === 'feedback') {
                       if (data.c) {
                         // Thêm khoảng trắng giữa các từ nếu đã có nội dung
                         const separator = tempResult.feedback && !tempResult.feedback.endsWith(' ') ? ' ' : '';
                         tempResult.feedback += separator + data.c;
                       } else {
                         tempResult.feedback = data.v;
                       }
                       // Cập nhật UI ngay lập tức
                       setEvaluationResult({...tempResult});
                     } else if (data.k === 'errors') {
                       if (data.c) {
                         // Xử lý errors như một chuỗi liên tục
                         const currentErrors = tempResult.errors;
                         const separator = currentErrors && !currentErrors.endsWith(' ') ? ' ' : '';
                         const newErrorText = currentErrors + separator + data.c;
                         tempResult.errors = [newErrorText];
                       } else if (Array.isArray(data.v)) {
                         tempResult.errors = data.v;
                       } else if (typeof data.v === 'string') {
                         tempResult.errors = [data.v];
                       }
                       // Cập nhật UI ngay lập tức
                       setEvaluationResult({...tempResult});
                     } else if (data.k === 'suggestions') {
                       if (data.c) {
                         // Xử lý suggestions như một chuỗi liên tục
                         const currentSuggestions = tempResult.suggestions;
                         const separator = currentSuggestions && !currentSuggestions.endsWith(' ') ? ' ' : '';
                         const newSuggestionText = currentSuggestions + separator + data.c;
                         tempResult.suggestions = [newSuggestionText];
                       } else if (Array.isArray(data.v)) {
                         tempResult.suggestions = data.v;
                       } else if (typeof data.v === 'string') {
                         tempResult.suggestions = [data.v];
                       }
                       // Cập nhật UI ngay lập tức
                       setEvaluationResult({...tempResult});
                     } else if (data.k === 'correctAnswer') {
                       if (data.c) {
                         // Thêm khoảng trắng giữa các từ nếu đã có nội dung
                         const separator = tempResult.correctAnswer && !tempResult.correctAnswer.endsWith(' ') ? ' ' : '';
                         tempResult.correctAnswer += separator + data.c;
                       } else {
                         tempResult.correctAnswer = data.v;
                       }
                       // Cập nhật UI ngay lập tức
                       setEvaluationResult({...tempResult});
                     }
                  } else if (data.e === 'end') {
                    console.log('Streaming completed');
                    setIsStreaming(false);
                    setEvaluating(false);
                  }
                } else {
                  console.error('Error parsing JSON line:', 'Line:', line);
                }
              }
            }
          }
        } else {
          console.error('Error evaluating answer:', await response.text());
          setIsStreaming(false);
          setEvaluating(false);
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
    } else {
      // Hoàn thành bài học
      router.push('/learning');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'translate' ? 'custom' : 'translate');
    setUserAnswer('');
    setEvaluationResult(null);
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
              onClick={() => router.push('/vocab')}
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
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
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
            <p className="p-3 bg-gray-100 rounded">{currentWord.example}</p>
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
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <div className={`mt-4 ${styles.streamingContainer}`}>
              <div className="flex items-center mb-3">
                <div className="text-sm font-medium text-gray-700">🤖 AI đang phân tích...</div>
                <div className="ml-2 text-xs text-gray-500">({chunkCount} chunks)</div>
              </div>
              {mode === 'custom' && (
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  <StreamingText 
                    text={streamingText}
                    speed={25}
                    showCursor={true}
                    enableSmoothing={true}
                    highlightNewWords={true}
                    className="text-gray-800"
                  />
                </div>
              )}
              {mode === 'translate' && evaluationResult && (
                <div className="text-sm text-gray-800 space-y-3">
                  {evaluationResult.score > 0 && (
                    <div className="flex items-center">
                      <strong className="text-blue-600 mr-2">📊 Điểm:</strong> 
                      <span className="font-semibold text-lg">{evaluationResult.score}/100</span>
                    </div>
                  )}
                  {evaluationResult.feedback && (
                    <div>
                      <strong className="text-green-600 block mb-1">💬 Nhận xét:</strong>
                      <StreamingText 
                        text={evaluationResult.feedback}
                        speed={20}
                        showCursor={true}
                        enableSmoothing={true}
                        className="text-gray-700"
                      />
                    </div>
                  )}
                  {evaluationResult.errors && (
                    <div>
                      <strong className="text-red-600 block mb-1">❌ Lỗi:</strong>
                      <StreamingText 
                        text={evaluationResult.errors}
                        speed={20}
                        showCursor={true}
                        enableSmoothing={true}
                        className="text-red-600"
                      />
                    </div>
                  )}
                  {evaluationResult.suggestions && (
                    <div>
                      <strong className="text-blue-600 block mb-1">💡 Gợi ý:</strong>
                      <StreamingText 
                        text={evaluationResult.suggestions}
                        speed={20}
                        showCursor={true}
                        enableSmoothing={true}
                        className="text-blue-600"
                      />
                    </div>
                  )}
                  {evaluationResult.correctAnswer && (
                    <div>
                      <strong className="text-purple-600 block mb-1">✅ Đáp án tham khảo:</strong>
                      <StreamingText 
                        text={evaluationResult.correctAnswer}
                        speed={20}
                        showCursor={true}
                        enableSmoothing={true}
                        className="text-purple-600 font-medium"
                      />
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
                  className={`h-2 rounded-full ${evaluationResult.score >= 80 ? 'bg-green-500' : evaluationResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${evaluationResult.score}%` }}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Nhận xét:</h3>
              <p>{evaluationResult.feedback}</p>
            </div>
            
            {evaluationResult.errors && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Lỗi:</h3>
                <p className="text-red-600">{evaluationResult.errors}</p>
              </div>
            )}
            
            {evaluationResult.suggestions && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Gợi ý:</h3>
                <p className="text-green-600">{evaluationResult.suggestions}</p>
              </div>
            )}
            
            {mode === 'translate' && evaluationResult.correctAnswer && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Câu dịch tham khảo:</h3>
                <p className="p-2 bg-gray-100 rounded">{evaluationResult.correctAnswer}</p>
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

export default ExampleLearningPage;