import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { safeJsonParse } from '@/utils/jsonUtils';

// Simple UI Components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gray-700 rounded-lg border shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 pb-4">{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, disabled = false, className = '' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const Input = ({ value, onChange, placeholder, type = 'text', className = '', min, max }: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  min?: string;
  max?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    min={min}
    max={max}
    className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3, className = '' }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${className}`}
  />
);

const Badge = ({ children, variant = 'default' }: {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
}) => {
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    destructive: 'bg-red-100 text-red-800'
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

// Simple Icons
const AlertCircle = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const BookOpen = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

const CheckCircle = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22,4 12,14.01 9,11.01"></polyline>
  </svg>
);

const Clock = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

const Loader2 = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 12a9 9 0 11-6.219-8.56"></path>
  </svg>
);

const Star = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"></polygon>
  </svg>
);

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  isLoading?: boolean;
}

interface EvaluationResult {
  score: number | null;
  feedback: string;
  errors: string[];
  suggestions: string[];
  examples?: string[];
  correctAnswer?: string;
  isLoading?: boolean;
}

interface Progress {
  stage: string;
  message: string;
}

const LearningSkeletonDemo = () => {
  // States for Init Stream Demo
  const [words, setWords] = useState<Word[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [wordCount, setWordCount] = useState(5);
  
  // States for Custom Evaluation Demo
  const [customWord, setCustomWord] = useState('beautiful');
  const [customMeaning, setCustomMeaning] = useState('đẹp');
  const [customAnswer, setCustomAnswer] = useState('She is very beautiful today.');
  const [customEvaluation, setCustomEvaluation] = useState<EvaluationResult>({
    score: null,
    feedback: '',
    errors: [],
    suggestions: [],
    examples: [],
    isLoading: false
  });
  const [customProgress, setCustomProgress] = useState<Progress | null>(null);
  const [isEvaluatingCustom, setIsEvaluatingCustom] = useState(false);
  
  // States for Translation Evaluation Demo
  const [translationWord, setTranslationWord] = useState('apple');
  const [translationMeaning, setTranslationMeaning] = useState('quả táo');
  const [translationExample, setTranslationExample] = useState('I eat an apple every day.');
  const [translationAnswer, setTranslationAnswer] = useState('Tôi ăn một quả táo mỗi ngày.');
  const [translationEvaluation, setTranslationEvaluation] = useState<EvaluationResult>({
    score: null,
    feedback: '',
    errors: [],
    suggestions: [],
    correctAnswer: '',
    isLoading: false
  });
  const [translationProgress, setTranslationProgress] = useState<Progress | null>(null);
  const [isEvaluatingTranslation, setIsEvaluatingTranslation] = useState(false);

  // Demo 1: Init Stream với Skeleton Loading
  const handleInitStream = async () => {
    setIsLoadingWords(true);
    setWords([]);
    
    try {
      const response = await fetch(`/api/learning/example/init-stream?count=${wordCount}`, {
        headers: {
          'firebase_uid': 'demo_user_123'
        }
      });
      
      if (!response.body) {
        throw new Error('No response body');
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
          
          if (line) {
            const parsed = safeJsonParse(line);
            if (parsed) {
              
              if (parsed.type === 'skeleton') {
                flushSync(() => {
                  setWords(parsed.words);
                });
              } else if (parsed.type === 'update') {
                flushSync(() => {
                  setWords(prev => prev.map(word => 
                    word.id === parsed.wordId 
                      ? { ...word, example: parsed.example, isLoading: false }
                      : word
                  ));
                });
              } else if (parsed.type === 'complete') {
                flushSync(() => {
                  setIsLoadingWords(false);
                });
              }
            } else {
              console.log(`[${new Date().toISOString()}] Could not parse:`, line);
            }
          }
        }
        
        // Force UI update by yielding control back to the event loop
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (error) {
      console.error('Error:', error);
      setIsLoadingWords(false);
    }
  };

  // Demo 2: Custom Evaluation với Skeleton Loading
  const handleCustomEvaluation = async () => {
    setIsEvaluatingCustom(true);
    setCustomEvaluation({
      score: null,
      feedback: '',
      errors: [],
      suggestions: [],
      examples: [],
      isLoading: true
    });
    setCustomProgress(null);
    
    try {
      const response = await fetch('/api/learning/example/evaluate-custom-skeleton', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': 'demo_user_123'
        },
        body: JSON.stringify({
          word: customWord,
          meaning: customMeaning,
          userAnswer: customAnswer
        })
      });
      
      if (!response.body) {
        throw new Error('No response body');
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
            const parsed = safeJsonParse(line);
            if (parsed) {
              
              if (parsed.e === 'start') {
                // Bắt đầu streaming - hiển thị skeleton
                flushSync(() => {
                  setCustomProgress({ stage: 'analyzing', message: 'Đang phân tích câu trả lời...' });
                });
              } else if (parsed.e === 'data') {
                // Xử lý dữ liệu streaming theo từng field
                flushSync(() => {
                  setCustomEvaluation(prev => {
                    const updated = { ...prev };
                    
                    if (parsed.k === 'score') {
                      updated.score = parsed.v;
                      setCustomProgress({ stage: 'scoring', message: `Đã chấm điểm: ${parsed.v}/100` });
                    } else if (parsed.k === 'feedback') {
                      if (parsed.c) {
                        // Thêm khoảng trắng giữa các từ nếu đã có nội dung
                        const separator = updated.feedback && !updated.feedback.endsWith(' ') ? ' ' : '';
                        updated.feedback += separator + parsed.c;
                        setCustomProgress({ stage: 'feedback', message: 'Đang tạo phản hồi...' });
                      }
                    } else if (parsed.k === 'errors') {
                      if (parsed.c) {
                        // Xử lý errors như một chuỗi liên tục thay vì mảng
                        const currentErrors = updated.errors;
                        const separator = currentErrors && !currentErrors.endsWith(' ') ? ' ' : '';
                        const newErrorText = currentErrors + separator + parsed.c;
                        updated.errors = [newErrorText];
                        setCustomProgress({ stage: 'errors', message: 'Đang phân tích lỗi...' });
                      }
                    } else if (parsed.k === 'suggestions') {
                      if (parsed.c) {
                        // Xử lý suggestions như một chuỗi liên tục thay vì mảng
                        const currentSuggestions = updated.suggestions;
                        const separator = currentSuggestions && !currentSuggestions.endsWith(' ') ? ' ' : '';
                        const newSuggestionText = currentSuggestions + separator + parsed.c;
                        updated.suggestions = [newSuggestionText];
                        setCustomProgress({ stage: 'suggestions', message: 'Đang tạo gợi ý...' });
                      }
                    } else if (parsed.k === 'correctAnswer') {
                      if (parsed.c) {
                        // Thêm khoảng trắng giữa các từ nếu đã có nội dung
                        const separator = updated.correctAnswer && !updated.correctAnswer.endsWith(' ') ? ' ' : '';
                        updated.correctAnswer = (updated.correctAnswer || '') + separator + parsed.c;
                        setCustomProgress({ stage: 'correctAnswer', message: 'Đang tạo đáp án mẫu...' });
                      }
                    }
                    
                    return updated;
                  });
                });
              } else if (parsed.e === 'end') {
                // Kết thúc streaming
                flushSync(() => {
                  setCustomEvaluation(prev => ({ ...prev, isLoading: false }));
                  setCustomProgress({ stage: 'complete', message: 'Hoàn thành đánh giá!' });
                  setIsEvaluatingCustom(false);
                });
              }
            } else {
              console.log(`[${new Date().toISOString()}] Could not parse:`, line);
            }
          }
        }
        
        // Force UI update by yielding control back to the event loop
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (error) {
      console.error('Error:', error);
      setIsEvaluatingCustom(false);
    }
  };

  // Demo 3: Translation Evaluation với Skeleton Loading
  const handleTranslationEvaluation = async () => {
    setIsEvaluatingTranslation(true);
    setTranslationEvaluation({
      score: null,
      feedback: '',
      errors: [],
      suggestions: [],
      correctAnswer: '',
      isLoading: true
    });
    setTranslationProgress(null);
    
    try {
      const response = await fetch('/api/learning/example/evaluate-translation-skeleton', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': 'demo_user_123'
        },
        body: JSON.stringify({
          word: translationWord,
          meaning: translationMeaning,
          example: translationExample,
          userAnswer: translationAnswer
        })
      });
      
      if (!response.body) {
        throw new Error('No response body');
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
            const parsed = safeJsonParse(line);
            if (parsed) {
              
              if (parsed.e === 'start') {
                // Bắt đầu streaming - hiển thị skeleton
                flushSync(() => {
                  setTranslationProgress({ stage: 'analyzing', message: 'Đang phân tích bản dịch...' });
                });
              } else if (parsed.e === 'data') {
                // Xử lý dữ liệu streaming theo từng field
                flushSync(() => {
                  setTranslationEvaluation(prev => {
                    const updated = { ...prev };
                    
                    if (parsed.k === 'score') {
                      updated.score = parsed.v;
                      setTranslationProgress({ stage: 'scoring', message: `Đã chấm điểm: ${parsed.v}/100` });
                    } else if (parsed.k === 'feedback') {
                      if (parsed.c) {
                        // Thêm khoảng trắng giữa các từ nếu đã có nội dung
                        const separator = updated.feedback && !updated.feedback.endsWith(' ') ? ' ' : '';
                        updated.feedback += separator + parsed.c;
                        setTranslationProgress({ stage: 'feedback', message: 'Đang tạo phản hồi...' });
                      }
                    } else if (parsed.k === 'errors') {
                      if (parsed.c) {
                        // Xử lý errors như một chuỗi liên tục thay vì mảng
                        const currentErrors = updated.errors;
                        const separator = currentErrors && !currentErrors.endsWith(' ') ? ' ' : '';
                        const newErrorText = currentErrors + separator + parsed.c;
                        updated.errors = [newErrorText];
                        setTranslationProgress({ stage: 'errors', message: 'Đang phân tích lỗi...' });
                      }
                    } else if (parsed.k === 'suggestions') {
                      if (parsed.c) {
                        // Xử lý suggestions như một chuỗi liên tục thay vì mảng
                        const currentSuggestions = updated.suggestions;
                        const separator = currentSuggestions && !currentSuggestions.endsWith(' ') ? ' ' : '';
                        const newSuggestionText = currentSuggestions + separator + parsed.c;
                        updated.suggestions = [newSuggestionText];
                        setTranslationProgress({ stage: 'suggestions', message: 'Đang tạo gợi ý...' });
                      }
                    } else if (parsed.k === 'correctAnswer') {
                      if (parsed.c) {
                        // Thêm khoảng trắng giữa các từ nếu đã có nội dung
                        const separator = updated.correctAnswer && !updated.correctAnswer.endsWith(' ') ? ' ' : '';
                        updated.correctAnswer = (updated.correctAnswer || '') + separator + parsed.c;
                        setTranslationProgress({ stage: 'correctAnswer', message: 'Đang tạo đáp án đúng...' });
                      }
                    }
                    
                    return updated;
                  });
                });
              } else if (parsed.e === 'end') {
                // Kết thúc streaming
                flushSync(() => {
                  setTranslationEvaluation(prev => ({ ...prev, isLoading: false }));
                  setTranslationProgress({ stage: 'complete', message: 'Hoàn thành đánh giá!' });
                  setIsEvaluatingTranslation(false);
                });
              }
            } else {
              console.log(`[${new Date().toISOString()}] Could not parse:`, line);
            }
          }
        }
        
        // Force UI update by yielding control back to the event loop
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (error) {
      console.error('Error:', error);
      setIsEvaluatingTranslation(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Learning API với Skeleton Streaming
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Demo kỹ thuật Skeleton Loading + JSON Streaming cho các API học từ vựng. 
          Trải nghiệm UI mượt mà với progressive loading và real-time updates.
        </p>
      </div>

      {/* Demo 1: Init Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex bg-gray-700 items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Demo 1: Khởi tạo từ vựng với Skeleton Streaming
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label>Số lượng từ:</label>
              <Input 
                type="number" 
                value={wordCount} 
                onChange={(e) => setWordCount(parseInt(e.target.value) || 5)}
                className="w-20"
                min="1"
                max="10"
              />
            </div>
            <Button 
              onClick={handleInitStream} 
              disabled={isLoadingWords}
              className="flex items-center gap-2"
            >
              {isLoadingWords ? <Loader2 className="h-4 w-4 bg-gray-700 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              {isLoadingWords ? 'Đang tải...' : 'Tải từ vựng'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {words.map((word) => (
              <Card key={word.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{word.word}</h3>
                      {word.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <p className="text-gray-600">{word.meaning}</p>
                    <div className="border-t pt-2">
                      <p className="text-sm text-gray-500 mb-1">Ví dụ:</p>
                      {word.isLoading || !word.example ? (
                        <Skeleton className="h-4 w-full" />
                      ) : (
                        <p className="text-sm italic">{word.example}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo 2: Custom Evaluation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Demo 2: Đánh giá câu tự đặt với Skeleton Streaming
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Từ vựng:</label>
                <Input 
                  value={customWord} 
                  onChange={(e) => setCustomWord(e.target.value)}
                  placeholder="Nhập từ vựng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nghĩa:</label>
                <Input 
                  value={customMeaning} 
                  onChange={(e) => setCustomMeaning(e.target.value)}
                  placeholder="Nhập nghĩa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Câu trả lời của bạn:</label>
                <Textarea 
                  value={customAnswer} 
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  placeholder="Nhập câu sử dụng từ vựng"
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleCustomEvaluation} 
                disabled={isEvaluatingCustom}
                className="w-full flex items-center gap-2"
              >
                {isEvaluatingCustom ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {isEvaluatingCustom ? 'Đang đánh giá...' : 'Đánh giá câu trả lời'}
              </Button>
            </div>
            
            <div className="space-y-4">
              {customProgress && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">{customProgress.message}</span>
                </div>
              )}
              
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Điểm số:</span>
                    {customEvaluation.score === null ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <Badge variant={customEvaluation.score >= 70 ? 'default' : 'destructive'}>
                        {customEvaluation.score}/100
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <span className="font-medium block mb-1">Nhận xét:</span>
                    {customEvaluation.isLoading || !customEvaluation.feedback ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <p className="text-sm bg-gray-700 text-gray-600">{customEvaluation.feedback}</p>
                    )}
                  </div>
                  
                  {customEvaluation.errors && (
                     <div>
                       <span className="font-medium block mb-1 text-red-600">Lỗi:</span>
                       <div className="flex items-start gap-2">
                         <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                         <span className="text-sm text-red-600">{customEvaluation.errors}</span>
                       </div>
                     </div>
                   )}
                   
                   {customEvaluation.suggestions && (
                     <div>
                       <span className="font-medium block mb-1 text-blue-600">Gợi ý:</span>
                       <div className="flex items-start gap-2">
                         <CheckCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                         <span className="text-sm text-blue-600">{customEvaluation.suggestions}</span>
                       </div>
                     </div>
                   )}
                  
                  {customEvaluation.examples && customEvaluation.examples.length > 0 && (
                    <div>
                      <span className="font-medium block mb-1 text-green-600">Ví dụ tham khảo:</span>
                      <ul className="text-sm space-y-1">
                        {customEvaluation.examples.map((example, index) => (
                          <li key={index} className="text-green-600 italic">
                            "{example}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo 3: Translation Evaluation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Demo 3: Đánh giá bản dịch với Skeleton Streaming
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Từ vựng:</label>
                <Input 
                  value={translationWord} 
                  onChange={(e) => setTranslationWord(e.target.value)}
                  placeholder="Nhập từ vựng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nghĩa:</label>
                <Input 
                  value={translationMeaning} 
                  onChange={(e) => setTranslationMeaning(e.target.value)}
                  placeholder="Nhập nghĩa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Câu ví dụ:</label>
                <Input 
                  value={translationExample} 
                  onChange={(e) => setTranslationExample(e.target.value)}
                  placeholder="Nhập câu ví dụ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bản dịch của bạn:</label>
                <Textarea 
                  value={translationAnswer} 
                  onChange={(e) => setTranslationAnswer(e.target.value)}
                  placeholder="Nhập bản dịch"
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleTranslationEvaluation} 
                disabled={isEvaluatingTranslation}
                className="w-full flex items-center gap-2"
              >
                {isEvaluatingTranslation ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {isEvaluatingTranslation ? 'Đang đánh giá...' : 'Đánh giá bản dịch'}
              </Button>
            </div>
            
            <div className="space-y-4">
              {translationProgress && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">{translationProgress.message}</span>
                </div>
              )}
              
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Điểm số:</span>
                    {translationEvaluation.score === null ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <Badge variant={translationEvaluation.score >= 70 ? 'default' : 'destructive'}>
                        {translationEvaluation.score}/100
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <span className="font-medium block mb-1">Nhận xét:</span>
                    {translationEvaluation.isLoading || !translationEvaluation.feedback ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <p className="text-sm text-gray-600">{translationEvaluation.feedback}</p>
                    )}
                  </div>
                  
                  <div>
                    <span className="font-medium block mb-1 text-green-600">Bản dịch chuẩn:</span>
                    {translationEvaluation.isLoading || !translationEvaluation.correctAnswer ? (
                      <Skeleton className="h-8 w-full" />
                    ) : (
                      <p className="text-sm text-green-600 italic bg-green-50 p-2 rounded">
                        "{translationEvaluation.correctAnswer}"
                      </p>
                    )}
                  </div>
                  
                  {translationEvaluation.errors && (
                     <div>
                       <span className="font-medium block mb-1 text-red-600">Lỗi:</span>
                       <div className="flex items-start gap-2">
                         <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                         <span className="text-sm text-red-600">{translationEvaluation.errors}</span>
                       </div>
                     </div>
                   )}
                   
                   {translationEvaluation.suggestions && (
                     <div>
                       <span className="font-medium block mb-1 text-blue-600">Gợi ý:</span>
                       <div className="flex items-start gap-2">
                         <CheckCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                         <span className="text-sm text-blue-600">{translationEvaluation.suggestions}</span>
                       </div>
                     </div>
                   )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin kỹ thuật */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle>🔧 Thông tin kỹ thuật</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">📡 Backend APIs:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <code>/api/learning/example/init-stream</code></li>
                <li>• <code>/api/learning/example/evaluate-custom-skeleton</code></li>
                <li>• <code>/api/learning/example/evaluate-translation-skeleton</code></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚡ Tính năng:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Server-Sent Events (SSE)</li>
                <li>• JSON Lines (JSONL) streaming</li>
                <li>• Progressive skeleton loading</li>
                <li>• Real-time UI updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎯 Lợi ích:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Trải nghiệm người dùng mượt mà</li>
                <li>• Giảm thời gian chờ đợi</li>
                <li>• Feedback tức thì</li>
                <li>• Tối ưu hiệu suất</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningSkeletonDemo;