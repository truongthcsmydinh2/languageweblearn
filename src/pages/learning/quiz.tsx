import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Button, Card, Container, Form, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import styles from '@/styles/Learning.module.css';

interface Word {
  id: number;
  vocab?: string;
  meaning?: string;
  english?: string;
  vietnamese?: string;
  level_en: number;
  level_vi: number;
}

interface Question {
  word: string;
  question: string;
  options: string[];
  correctAnswer: string;
  vietnamese: string;
  answerIndex?: number; // Vị trí đáp án đúng (0-3)
}

const QuizMode = () => {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [questionMode, setQuestionMode] = useState<'setup' | 'quiz' | 'results'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Fetch user's words
  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await axios.get('/api/vocab');
        setWords(response.data);
        setMaxQuestions(response.data.length);
        setLoading(false);
      } catch (err) {
        setError('Đã xảy ra lỗi khi tải từ vựng. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchWords();
  }, []);

  // Generate questions using Google Gemini API
  const generateQuestions = async () => {
    if (numberOfQuestions <= 0 || numberOfQuestions > words.length) {
      setError(`Số lượng câu hỏi phải lớn hơn 0 và nhỏ hơn hoặc bằng ${words.length}`);
      return;
    }

    setIsGeneratingQuestions(true);
    setError(null);

    try {
      // Kiểm tra xem words có phải là mảng không và có phần tử không
      if (!Array.isArray(words) || words.length === 0) {
        setError('Không tìm thấy từ vựng nào. Vui lòng thêm từ vựng trước khi sử dụng tính năng này.');
        setIsGeneratingQuestions(false);
        return;
      }
      
      // Kiểm tra xem có từ vựng hợp lệ không
      const validWords = words.filter(word => word && word.vocab && word.meaning).map(word => ({
        ...word,
        english: word.vocab,
        vietnamese: word.meaning
      }));
      console.log('Valid words:', validWords);
      
      if (validWords.length === 0) {
        setError('Không tìm thấy từ vựng hợp lệ. Vui lòng thêm từ vựng trước khi sử dụng tính năng này.');
        setIsGeneratingQuestions(false);
        return;
      }
      
      // Randomly select words for the quiz
      const shuffledWords = [...validWords].sort(() => 0.5 - Math.random());
      const selectedWords = shuffledWords.slice(0, Math.min(numberOfQuestions, validWords.length));
      
      console.log('Sending words to API:', selectedWords);
      
      // Call your backend API to generate questions using Google Gemini
      const response = await axios.post('/api/learning/generate-quiz', {
        words: selectedWords
      });
      
      console.log('API Response:', response.data);
      console.log('Questions array:', response.data.questions);
      
      if (!response.data.questions || !Array.isArray(response.data.questions) || response.data.questions.length === 0) {
        console.error('Invalid response format:', response.data);
        setError('Không thể tạo câu hỏi. Phản hồi từ API không đúng định dạng.');
        setIsGeneratingQuestions(false);
        return;
      }
      
      setQuestions(response.data.questions);
      console.log('Questions set to state:', response.data.questions);
      setQuestionMode('quiz');
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } catch (err) {
      console.error('Error generating questions:', err);
      setError('Đã xảy ra lỗi khi tạo câu hỏi. Vui lòng thử lại sau.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAnswerSelection = (option: string) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(option);
  };

  const checkAnswer = () => {
    if (!selectedAnswer || isAnswerChecked) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    // Kiểm tra dựa trên answerIndex (nếu có) hoặc correctAnswer
    const isCorrect = currentQuestion.answerIndex !== undefined 
      ? selectedAnswer === currentQuestion.options[currentQuestion.answerIndex]
      : selectedAnswer === currentQuestion.correctAnswer;
      
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setIsAnswerChecked(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      // Quiz completed
      setQuestionMode('results');
    }
  };

  const restartQuiz = () => {
    setQuestionMode('setup');
    setQuestions([]);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setCurrentQuestionIndex(0);
    setScore(0);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className={styles.learningContainer}>
      <h1 className="mb-4">Chế độ Trắc nghiệm Thông minh</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {questionMode === 'setup' && (
        <Card className="p-4">
          <h2 className="mb-3">Thiết lập trắc nghiệm</h2>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Số lượng câu hỏi (tối đa {maxQuestions})</Form.Label>
              <Form.Control 
                type="number" 
                min="1" 
                max={maxQuestions} 
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 1)}
              />
            </Form.Group>
            <Button 
              variant="primary" 
              onClick={generateQuestions}
              disabled={isGeneratingQuestions}
            >
              {isGeneratingQuestions ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  {' '}Đang tạo câu hỏi...
                </>
              ) : 'Bắt đầu làm bài'}
            </Button>
          </Form>
        </Card>
      )}
      
      {questionMode === 'quiz' && questions.length > 0 && (
        <Card className="p-4">
          <div className="mb-3">
            <ProgressBar 
              now={(currentQuestionIndex + 1) / questions.length * 100} 
              label={`${currentQuestionIndex + 1}/${questions.length}`} 
            />
          </div>
          
          {questions[currentQuestionIndex] ? (
            <>              
              <div className="my-4">
                <p>{questions[currentQuestionIndex].question}</p>
                
                <div className="mt-3">
                  {questions[currentQuestionIndex].options.map((option, index) => {
                    const isCorrectAnswer = questions[currentQuestionIndex].answerIndex !== undefined
                      ? index === questions[currentQuestionIndex].answerIndex
                      : option === questions[currentQuestionIndex].correctAnswer;
                      
                    return (
                      <div 
                        key={index}
                        className={`p-2 mb-2 border rounded ${
                          selectedAnswer === option 
                            ? isAnswerChecked 
                              ? isCorrectAnswer
                                ? 'bg-success text-white' 
                                : 'bg-danger text-white'
                              : 'bg-primary text-white'
                            : isAnswerChecked && isCorrectAnswer
                              ? 'bg-success text-white'
                              : 'bg-light'
                        }`}
                        onClick={() => handleAnswerSelection(option)}
                        style={{ cursor: isAnswerChecked ? 'default' : 'pointer' }}
                      >
                        {option}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 d-flex justify-content-between">
                  {!isAnswerChecked ? (
                    <Button 
                      variant="primary" 
                      onClick={checkAnswer}
                      disabled={!selectedAnswer}
                    >
                      Kiểm tra
                    </Button>
                  ) : (
                    <Button 
                      variant="success" 
                      onClick={nextQuestion}
                    >
                      {currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <Alert variant="warning">Không tìm thấy câu hỏi</Alert>
          )}
        </Card>
      )}
      
      {questionMode === 'results' && (
        <Card className="p-4 text-center">
          <h2 className="mb-3">Kết quả</h2>
          <p className="lead">Bạn đã trả lời đúng {score}/{questions.length} câu hỏi</p>
          <p>Tỷ lệ chính xác: {((score / questions.length) * 100).toFixed(1)}%</p>
          
          <div className="mt-4">
            <Button variant="primary" onClick={restartQuiz}>
              Làm lại
            </Button>
          </div>
        </Card>
      )}
    </Container>
  );
};

export default QuizMode;