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
  // Removed mode state - only using translate mode now
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [chunkCount, setChunkCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [wordCount, setWordCount] = useState(10);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const answerInputRef = useRef<HTMLTextAreaElement>(null);
  
  // States for AI Q&A feature
  const [showQASection, setShowQASection] = useState(false);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaResponse, setQaResponse] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaStreaming, setQaStreaming] = useState(false);
  const qaInputRef = useRef<HTMLTextAreaElement>(null);
  const [qaInputValue, setQaInputValue] = useState('');
  
  // States for translation feature
  const [selectedText, setSelectedText] = useState('');
  const [translationResult, setTranslationResult] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationPosition, setTranslationPosition] = useState({ x: 0, y: 0 });
  
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
      console.log('Firebase UID:', user?.uid || 'N/A'); // Debug log

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
  };

  const handleNext = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setUserAnswer('');
      setEvaluationResult(null);
      // Reset Q&A state
      handleResetQA();
      // Reset translation state
      closeTranslation();
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

  // Removed toggleMode function - only using translate mode now

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleQASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaInputValue.trim()) return;

    const currentWord = words[currentWordIndex];
    
    try {
      setQaLoading(true);
      setQaStreaming(true);
      setQaResponse('');
      
      const response = await fetch('/api/learning/example/qa-stream', {
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
          evaluationResult,
          question: qaInputValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.substring(0, newlineIndex).trim();
            buffer = buffer.substring(newlineIndex + 1);
            
            if (line && !line.startsWith('```')) {
              const parsed = safeJsonParse(line);
              if (parsed) {
                if (parsed.e === 'data' && parsed.k === 'response' && parsed.c) {
                  currentResponse += parsed.c;
                  setQaResponse(currentResponse);
                } else if (parsed.e === 'end') {
                  setQaStreaming(false);
                  setQaLoading(false);
                  setQaInputValue(''); // Reset input after successful submission
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in Q&A:', error);
      setQaStreaming(false);
      setQaLoading(false);
    }
  };

  const handleShowQA = () => {
    setShowQASection(true);
    setTimeout(() => {
      qaInputRef.current?.focus();
    }, 100);
  };

  const handleResetQA = () => {
    setQaInputValue('');
    setQaResponse('');
    setShowQASection(false);
    setQaLoading(false);
    setQaStreaming(false);
  };

  // Translation functions
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      // Check if selection is inside input/textarea elements
      const range = selection?.getRangeAt(0);
      const container = range?.commonAncestorContainer;
      const parentElement = container?.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
      
      // Don't show translation popup if selection is inside input/textarea
      if (parentElement && (parentElement.closest('input') || parentElement.closest('textarea'))) {
        return;
      }
      
      setSelectedText(text);
      
      // Get selection position
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setTranslationPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setShowTranslation(true);
      }
    } else {
      setShowTranslation(false);
    }
  };

  const translateText = async (text: string, targetLang: 'en' | 'vi') => {
    try {
      setTranslationLoading(true);
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setTranslationResult(data.translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationResult('Lỗi dịch thuật');
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleTranslateClick = (targetLang: 'en' | 'vi') => {
    if (selectedText) {
      translateText(selectedText, targetLang);
    }
  };

  const closeTranslation = () => {
    setShowTranslation(false);
    setTranslationResult('');
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  // Add event listeners for text selection
  useEffect(() => {
    let isSelecting = false;
    
    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't handle text selection if clicking on input/textarea
      if (target.closest('input') || target.closest('textarea')) {
        return;
      }
      
      isSelecting = true;
      setTimeout(() => {
        handleTextSelection();
        // Reset flag after a short delay to allow popup to show
        setTimeout(() => {
          isSelecting = false;
        }, 100);
      }, 10);
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if we're in the middle of selecting text
      if (isSelecting) {
        return;
      }
      
      const target = e.target as HTMLElement;
      if (!target.closest('.translation-popup') && !target.closest('input') && !target.closest('textarea')) {
        closeTranslation();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary-600">{currentWord.word}</h2>
          <p className="text-gray-600">{currentWord.meaning}</p>
        </div>
        
        <div className="mb-4">
          <h3 className="font-bold text-2xl mb-2">Câu ví dụ:</h3>
          <p className="bg-gray-700  font-bold text-2xl rounded">{currentWord.example}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="answer" className="block font-medium mb-2">
              Dịch câu trên sang tiếng Anh:
            </label>
            <textarea
              id="answer"
              ref={answerInputRef}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full p-2 border border-gray-300 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              disabled={!!evaluationResult}
              placeholder="Nhập bản dịch của bạn..."
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
              {evaluationResult && (
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
            
            {evaluationResult.correctAnswer && (
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
            
            {/* Q&A Section */}
            <div className="mt-6 border-t pt-4">
              {!showQASection ? (
                <button
                  onClick={handleShowQA}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
                >
                  🤔 Hỏi AI thêm
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">💬 Hỏi AI về bài này</h3>
                    <button
                      onClick={handleResetQA}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      ✕ Đóng
                    </button>
                  </div>
                  
                  <form onSubmit={handleQASubmit}>
                    <div className="mb-4">
              <textarea
                id="qa-question"
                ref={qaInputRef}
                value={qaInputValue}
                onChange={(e) => setQaInputValue(e.target.value)}
                className="w-full p-2 border border-gray-300 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Hỏi AI về từ vựng này..."
                disabled={qaLoading}
              />
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                      disabled={qaLoading || !qaInputValue.trim()}
                    >
                      {qaLoading ? 'Đang hỏi AI...' : 'Gửi câu hỏi'}
                    </button>
                  </form>
                  
                  {qaResponse && (
                    <div className="mt-4 p-4 bg-gray-700 rounded border">
                      <h4 className="font-bold text-yellow-500 text-2xl mb-2">🤖 Trả lời từ AI:</h4>
                      <div className="whitespace-pre-line">
                        <StreamingText
                          text={formatTextWithLineBreaks(qaResponse)}
                          speed={qaStreaming ? 25 : 0}
                          showCursor={qaStreaming}
                          enableSmoothing={true}
                          className="text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={handleNext}
              className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 mt-4"
            >
              {currentWordIndex < words.length - 1 ? 'Tiếp tục' : 'Hoàn thành'}
            </button>
          </div>
        )}
      </div>
      
      {/* Translation Popup */}
      {showTranslation && (
        <div 
          className="translation-popup fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[200px]"
          style={{
            left: `${translationPosition.x}px`,
            top: `${translationPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="text-sm text-black mb-2">
            <strong>Đã chọn:</strong> "{selectedText}"
          </div>
          
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => handleTranslateClick('en')}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
              disabled={translationLoading}
            >
              🇺🇸 Sang EN
            </button>
            <button
              onClick={() => handleTranslateClick('vi')}
              className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
              disabled={translationLoading}
            >
              🇻🇳 Sang VI
            </button>
            <button
              onClick={closeTranslation}
              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              ✕
            </button>
          </div>
          
          {translationLoading && (
            <div className="text-xs text-gray-600">Đang dịch...</div>
          )}
          
          {translationResult && (
            <div className="text-sm bg-gray-700 p-2 rounded border-t">
              <strong>Dịch:</strong> {translationResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VocabExamplePage;