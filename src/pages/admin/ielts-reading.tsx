import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface Passage {
  id: number;
  title: string;
  content: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  time_limit: number;
  is_active: boolean;
  question_count: number;
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'diagram_labelling' | 'short_answer_questions';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  note?: string;
  order_index: number;
}

// Thêm interface cho đề IELTS Reading hoàn chỉnh
interface IeltsReadingTest {
  title: string;
  description: string;
  is_active: boolean;
  passages: {
    title: string;
    content: string;
    questions: {
      question_text: string;
      question_type?: string;
      note?: string;
      order_index: number;
    }[];
  }[];
  // Thêm trường cho đáp án toàn bộ đề thi
  all_answers?: {
    question_number: string;
    answer: string;
    explanation?: string;
    order_index: number;
  }[];
}

const IeltsReadingAdminPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [groupedPassages, setGroupedPassages] = useState<any>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [showPassageForm, setShowPassageForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingPassage, setEditingPassage] = useState<Passage | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form states
  const [passageForm, setPassageForm] = useState({
    title: '',
    content: '',
    level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    category: '',
    time_limit: 20,
    is_active: true
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'diagram_labelling' | 'short_answer_questions',
    options: ['', '', '', ''],
    note: '',
    order_index: 1
  });

  // Thêm state cho form thêm bài đọc với câu hỏi
  const [newPassageWithQuestions, setNewPassageWithQuestions] = useState({
    title: '',
    content: '',
    is_active: true,
    questions: [
      {
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching',
    options: ['', '', '', ''],
    order_index: 1
      }
    ]
  });

  // Thêm state cho form tạo đề IELTS Reading hoàn chỉnh
  const [ieltsReadingTest, setIeltsReadingTest] = useState<IeltsReadingTest>({
    title: '',
    description: '',
    is_active: true,
    passages: [
      {
        title: '',
        content: '',
        questions: []
      },
      {
        title: '',
        content: '',
        questions: []
      },
      {
        title: '',
        content: '',
        questions: []
      }
    ],
    all_answers: []
  });

  const [showIeltsTestForm, setShowIeltsTestForm] = useState(false);
  
  // Thêm state cho việc biên dịch câu hỏi
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<number | null>(null);
  
  // Thêm state cho việc biên dịch đáp án Task 3
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [rawAnswers, setRawAnswers] = useState('');
  
  // Thêm state cho câu hỏi thô
  const [rawQuestions, setRawQuestions] = useState<string[]>(['', '', '']);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Kiểm tra quyền admin
    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            'firebase_uid': user.uid || ''
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (!userData.is_admin) {
            router.push('/dashboard');
            return;
          }
        } else {
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/dashboard');
        return;
      }
    };

    checkAdminAccess();
    fetchPassages();
  }, [user, router]);

  const fetchPassages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ielts-reading/passages');
      if (response.ok) {
        const data = await response.json();
        setPassages(data.passages);
        setGroupedPassages(data.groupedPassages || {});
      }
    } catch (error) {
      console.error('Error fetching passages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (passageId: number) => {
    try {
      const response = await fetch(`/api/admin/ielts-reading/questions/${passageId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handlePassageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPassage 
        ? `/api/admin/ielts-reading/passages/${editingPassage.id}`
        : '/api/admin/ielts-reading/passages';
      
      const method = editingPassage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify(passageForm)
      });

      if (response.ok) {
        setShowPassageForm(false);
        setEditingPassage(null);
        setPassageForm({
          title: '',
          content: '',
          level: 'intermediate',
          category: '',
          time_limit: 20,
          is_active: true
        });
        fetchPassages();
      }
    } catch (error) {
      console.error('Error saving passage:', error);
    }
  };

  // Thêm hàm xử lý thêm bài đọc với câu hỏi
  const handleNewPassageWithQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Lọc bỏ các câu hỏi trống
      const validQuestions = newPassageWithQuestions.questions.filter(q => 
        q.question_text.trim() !== ''
      );

      if (validQuestions.length === 0) {
        alert('Vui lòng nhập ít nhất một câu hỏi!');
        return;
      }

      const response = await fetch('/api/admin/ielts-reading/passages-with-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify({
          title: newPassageWithQuestions.title,
          content: newPassageWithQuestions.content,
          is_active: newPassageWithQuestions.is_active,
          questions: validQuestions
        })
      });

      if (response.ok) {
        setShowPassageForm(false);
        setNewPassageWithQuestions({
          title: '',
          content: '',
          is_active: true,
          questions: [
            {
              question_text: '',
              question_type: 'multiple_choice',
              options: ['', '', '', ''],
              order_index: 1
            }
          ]
        });
        fetchPassages();
      }
    } catch (error) {
      console.error('Error saving passage with questions:', error);
    }
  };

  // Hàm tự động phân loại câu hỏi
  const autoClassifyQuestion = (questionText: string): 'multiple_choice' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'diagram_labelling' | 'short_answer_questions' => {
    const text = questionText.toLowerCase();

    // Kiểm tra câu hỏi điền từ
    if (text.includes('___') || text.includes('{blank}') || text.includes('...') || 
        text.includes('fill in') || text.includes('điền') || text.includes('complete') ||
        text.includes('fill the blank') || text.includes('complete the sentence') ||
        text.includes('sentence completion') || text.includes('summary completion') ||
        text.includes('note completion') || text.includes('table completion') ||
        text.includes('flow-chart completion') || text.includes('diagram labelling') ||
        text.includes('short-answer questions')) {
      return 'sentence_completion';
    }

    // Kiểm tra câu hỏi đúng/sai
    if (text.includes('true') || text.includes('false') || 
        text.includes('đúng') || text.includes('sai') ||
        text.includes('yes') || text.includes('no') ||
        text.includes('agree') || text.includes('disagree') ||
        text.includes('correct') || text.includes('incorrect') ||
        text.includes('statement') || text.includes('claim') ||
        text.includes('true/false/not given') || text.includes('yes/no/not given')) {
      return 'true_false_not_given';
    }

    // Kiểm tra câu hỏi matching
    if (text.includes('match') || text.includes('nối') || 
        text.includes('correspond') || text.includes('tương ứng') ||
        text.includes('connect') || text.includes('liên kết') ||
        text.includes('pair') || text.includes('link') ||
        text.includes('relate') || text.includes('associate') ||
        text.includes('matching headings') || text.includes('matching information') ||
        text.includes('matching features') || text.includes('matching sentence endings')) {
      return 'matching_headings';
    }

    // Mặc định là trắc nghiệm
    return 'multiple_choice';
  };

  // Hàm tạo options cho câu hỏi
  const generateOptions = (questionType: string): string[] => {
    if (questionType === 'true_false') {
      return ['True', 'False'];
    } else if (questionType === 'multiple_choice') {
      // Tạo options mặc định cho trắc nghiệm
      return ['A', 'B', 'C', 'D'];
    }
    return [];
  };

  // Hàm xử lý tạo đề IELTS Reading hoàn chỉnh
  const handleIeltsTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Xử lý và phân loại câu hỏi cho từng passage
      const processedPassages = ieltsReadingTest.passages.map((passage, passageIndex) => {
        // Tính toán số thứ tự bắt đầu cho Task hiện tại
        let startQuestionNumber = 1;
        for (let i = 0; i < passageIndex; i++) {
          startQuestionNumber += ieltsReadingTest.passages[i].questions.length;
        }
        
        const processedQuestions = passage.questions.map((question, questionIndex) => {
          const questionType = question.question_type || autoClassifyQuestion(question.question_text);
          const options = generateOptions(questionType);

          return {
            ...question,
            question_type: questionType,
            options: options,
            order_index: startQuestionNumber + questionIndex
          };
        });

        return {
          ...passage,
          questions: processedQuestions
        };
      });

      const response = await fetch('/api/admin/ielts-reading/complete-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify({
          title: ieltsReadingTest.title,
          description: ieltsReadingTest.description,
          is_active: ieltsReadingTest.is_active,
          passages: processedPassages,
          all_answers: ieltsReadingTest.all_answers || []
        })
      });

      if (response.ok) {
        setShowIeltsTestForm(false);
        setIeltsReadingTest({
          title: '',
          description: '',
          is_active: true,
          passages: [
            { title: '', content: '', questions: [] },
            { title: '', content: '', questions: [] },
            { title: '', content: '', questions: [] }
          ],
          all_answers: []
        });
        setRawAnswers('');
        setRawQuestions(['', '', '']);
        fetchPassages();
        alert('Tạo đề IELTS Reading thành công!');
      }
    } catch (error) {
      console.error('Error creating IELTS test:', error);
      alert('Có lỗi xảy ra khi tạo đề!');
    }
  };

  // Hàm thêm câu hỏi vào passage
  const addQuestionToPassage = (passageIndex: number) => {
    setIeltsReadingTest(prev => {
      // Tính toán số thứ tự bắt đầu cho Task hiện tại
      let startQuestionNumber = 1;
      for (let i = 0; i < passageIndex; i++) {
        startQuestionNumber += prev.passages[i].questions.length;
      }
      
      return {
        ...prev,
        passages: prev.passages.map((passage, index) => 
          index === passageIndex 
            ? {
                ...passage,
                questions: [
                  ...passage.questions,
                  {
                    question_text: '',
                    question_type: 'multiple_choice',
                    order_index: startQuestionNumber + passage.questions.length
                  }
                ]
              }
            : passage
        )
      };
    });
  };

  // Hàm xóa câu hỏi khỏi passage
  const removeQuestionFromPassage = (passageIndex: number, questionIndex: number) => {
    setIeltsReadingTest(prev => {
      // Xóa câu hỏi
      const updatedPassages = prev.passages.map((passage, index) => 
        index === passageIndex 
          ? {
              ...passage,
              questions: passage.questions.filter((_, qIndex) => qIndex !== questionIndex)
            }
          : passage
      );
      
      // Tính toán lại số thứ tự cho tất cả câu hỏi
      const recalculatedPassages = updatedPassages.map((passage, passageIndex) => {
        let startQuestionNumber = 1;
        for (let i = 0; i < passageIndex; i++) {
          startQuestionNumber += updatedPassages[i].questions.length;
        }
        
        return {
          ...passage,
          questions: passage.questions.map((question, questionIndex) => ({
            ...question,
            order_index: startQuestionNumber + questionIndex
          }))
        };
      });
      
      return {
        ...prev,
        passages: recalculatedPassages
      };
    });
  };

  // Hàm cập nhật câu hỏi trong passage
  const updateQuestionInPassage = (passageIndex: number, questionIndex: number, field: string, value: string) => {
    setIeltsReadingTest(prev => ({
      ...prev,
      passages: prev.passages.map((passage, index) => 
        index === passageIndex 
          ? {
              ...passage,
              questions: passage.questions.map((question, qIndex) => 
                qIndex === questionIndex 
                  ? { ...question, [field]: value }
                  : question
              )
            }
          : passage
      )
    }));
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPassage) return;

    let finalType: 'multiple_choice' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'diagram_labelling' | 'short_answer_questions';
    if (questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false_not_given' || questionForm.question_type === 'yes_no_not_given' || questionForm.question_type === 'matching_headings' || questionForm.question_type === 'matching_information' || questionForm.question_type === 'matching_features' || questionForm.question_type === 'matching_sentence_endings' || questionForm.question_type === 'sentence_completion' || questionForm.question_type === 'summary_completion' || questionForm.question_type === 'note_completion' || questionForm.question_type === 'table_completion' || questionForm.question_type === 'flow_chart_completion' || questionForm.question_type === 'diagram_labelling' || questionForm.question_type === 'short_answer_questions') {
      finalType = questionForm.question_type;
    } else {
      finalType = autoClassifyQuestion(questionForm.question_text);
    }

    try {
      const url = editingQuestion 
        ? `/api/admin/ielts-reading/questions/update/${editingQuestion.id}`
        : '/api/admin/ielts-reading/questions';
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify({
          ...questionForm,
          question_type: finalType,
          note: questionForm.note || null,
          passage_id: selectedPassage.id
        })
      });

      if (response.ok) {
        setShowQuestionForm(false);
        setEditingQuestion(null);
        setQuestionForm({
          question_text: '',
          question_type: 'multiple_choice',
          options: ['', '', '', ''],
          note: '',
          order_index: 1
        });
        fetchQuestions(selectedPassage.id);
      }
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const editPassage = (passage: Passage) => {
    setEditingPassage(passage);
    setPassageForm({
      title: passage.title,
      content: passage.content,
      level: passage.level,
      category: passage.category || '',
      time_limit: passage.time_limit,
      is_active: passage.is_active
    });
    setShowPassageForm(true);
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || ['', '', '', ''],
      note: question.note || '',
      order_index: question.order_index
    });
    setShowQuestionForm(true);
  };

  const deletePassage = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa bài đọc này?')) return;

    try {
      const response = await fetch(`/api/admin/ielts-reading/passages/${id}`, {
        method: 'DELETE',
        headers: {
          'firebase_uid': user?.uid || ''
        }
      });

      if (response.ok) {
        fetchPassages();
      }
    } catch (error) {
      console.error('Error deleting passage:', error);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;

    try {
      const response = await fetch(`/api/admin/ielts-reading/questions/update/${id}`, {
        method: 'DELETE',
        headers: {
          'firebase_uid': user?.uid || ''
        }
      });

      if (response.ok && selectedPassage) {
        fetchQuestions(selectedPassage.id);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const selectPassage = (passage: Passage) => {
    setSelectedPassage(passage);
    fetchQuestions(passage.id);
  };

  const addQuestionToNewPassage = () => {
    setNewPassageWithQuestions(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_text: '',
          question_type: 'multiple_choice',
          options: ['', '', '', ''],
          order_index: prev.questions.length + 1
        }
      ]
    }));
  };

  const removeQuestionFromNewPassage = (index: number) => {
    setNewPassageWithQuestions(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestionInNewPassage = (index: number, field: string, value: any) => {
    setNewPassageWithQuestions(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  // Hàm biên dịch câu hỏi sử dụng Gemini
  const generateQuestionsWithGemini = async (passageIndex: number) => {
    const passage = ieltsReadingTest.passages[passageIndex];
    const rawQuestion = rawQuestions[passageIndex];
    
    if (!passage.content.trim()) {
      alert('Vui lòng nhập nội dung bài đọc trước khi biên dịch câu hỏi!');
      return;
    }

    if (!rawQuestion.trim()) {
      alert('Vui lòng nhập câu hỏi thô trước khi biên dịch!');
      return;
    }

    setIsGeneratingQuestions(passageIndex);
    
    try {
      const response = await fetch('/api/admin/ielts-reading/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify({
          content: passage.content,
          passage_title: passage.title,
          raw_questions: rawQuestion
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.questions && data.questions.length > 0) {
          // Tính toán số thứ tự bắt đầu cho Task hiện tại
          let startQuestionNumber = 1;
          for (let i = 0; i < passageIndex; i++) {
            startQuestionNumber += ieltsReadingTest.passages[i].questions.length;
          }
          
          // Cập nhật câu hỏi cho passage với số thứ tự chính xác
          setIeltsReadingTest(prev => ({
            ...prev,
            passages: prev.passages.map((p, index) => 
              index === passageIndex 
                ? {
                    ...p,
                    questions: data.questions.map((q: any, qIndex: number) => ({
                      question_text: q.question_text,
                      question_type: q.question_type,
                      note: q.note || null,
                      order_index: startQuestionNumber + qIndex
                    }))
                  }
                : p
            )
          }));
          
          alert(`Đã sắp xếp thành công ${data.questions.length} câu hỏi cho Task ${passageIndex + 1}!`);
        } else {
          alert('Không thể sắp xếp câu hỏi. Vui lòng thử lại!');
        }
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.error || 'Không thể biên dịch câu hỏi'}`);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Có lỗi xảy ra khi biên dịch câu hỏi!');
    } finally {
      setIsGeneratingQuestions(null);
    }
  };

  // Hàm biên dịch đáp án toàn bộ đề thi sử dụng Gemini
  const generateAnswersWithGemini = async () => {
    const firstPassage = ieltsReadingTest.passages[0]; // Sử dụng passage đầu tiên để kiểm tra
    
    if (!firstPassage.content.trim()) {
      alert('Vui lòng nhập nội dung bài đọc Task 1 trước khi biên dịch đáp án!');
      return;
    }

    if (!rawAnswers.trim()) {
      alert('Vui lòng nhập đáp án thô trước khi biên dịch!');
      return;
    }

    setIsGeneratingAnswers(true);
    
    try {
      const response = await fetch('/api/admin/ielts-reading/generate-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify({
          content: firstPassage.content,
          passage_title: firstPassage.title,
          raw_answers: rawAnswers
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.answers && data.answers.length > 0) {
          // Cập nhật đáp án Task 3
          setIeltsReadingTest(prev => ({
            ...prev,
            all_answers: data.answers
          }));
          
          alert(`Đã biên dịch thành công ${data.answers.length} đáp án cho toàn bộ đề thi!`);
        } else {
          alert('Không thể biên dịch đáp án. Vui lòng thử lại!');
        }
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.error || 'Không thể biên dịch đáp án'}`);
      }
    } catch (error) {
      console.error('Error generating answers:', error);
      alert('Có lỗi xảy ra khi biên dịch đáp án!');
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  // Hàm di chuyển câu hỏi lên
  const moveQuestionUp = (passageIndex: number, questionIndex: number) => {
    if (questionIndex === 0) return; // Không thể di chuyển lên nếu là câu đầu tiên
    
    setIeltsReadingTest(prev => {
      const newPassages = [...prev.passages];
      const passage = newPassages[passageIndex];
      const questions = [...passage.questions];
      
      // Hoán đổi vị trí
      [questions[questionIndex], questions[questionIndex - 1]] = [questions[questionIndex - 1], questions[questionIndex]];
      
      // Cập nhật order_index
      questions.forEach((q, index) => {
        q.order_index = index + 1;
      });
      
      newPassages[passageIndex] = { ...passage, questions };
      
      return { ...prev, passages: newPassages };
    });
  };

  // Hàm di chuyển câu hỏi xuống
  const moveQuestionDown = (passageIndex: number, questionIndex: number) => {
    setIeltsReadingTest(prev => {
      const newPassages = [...prev.passages];
      const passage = newPassages[passageIndex];
      const questions = [...passage.questions];
      
      if (questionIndex === questions.length - 1) return prev; // Không thể di chuyển xuống nếu là câu cuối cùng
      
      // Hoán đổi vị trí
      [questions[questionIndex], questions[questionIndex + 1]] = [questions[questionIndex + 1], questions[questionIndex]];
      
      // Cập nhật order_index
      questions.forEach((q, index) => {
        q.order_index = index + 1;
      });
      
      newPassages[passageIndex] = { ...passage, questions };
      
      return { ...prev, passages: newPassages };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-50">Quản lý IELTS Reading</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowIeltsTestForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Tạo đề IELTS Reading
            </button>
          <button
            onClick={() => setShowPassageForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Thêm bài đọc mới
          </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Passages List */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-50 mb-4">Danh sách bài đọc</h2>
            
            {Object.keys(groupedPassages).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedPassages).map(([category, categoryPassages]: [string, any]) => (
                  <div key={category} className="border border-gray-600 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-200 mb-3">
                      {category === 'Uncategorized' ? 'Bài đọc riêng lẻ' : `Đề: ${category}`}
                      <span className="ml-2 text-sm text-gray-400">
                        ({categoryPassages.length} bài)
                      </span>
                    </h3>
                    
                    <div className="space-y-3">
                      {categoryPassages.map((passage: Passage) => (
                <div
                  key={passage.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPassage?.id === passage.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                  }`}
                  onClick={() => selectPassage(passage)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                              <h4 className="font-semibold mb-1 text-sm">{passage.title}</h4>
                              <div className="flex items-center space-x-3 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          passage.level === 'beginner' ? 'bg-green-600' :
                          passage.level === 'intermediate' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}>
                          {passage.level}
                        </span>
                        <span>{passage.time_limit} phút</span>
                        <span>{passage.question_count} câu hỏi</span>
                        <span className={passage.is_active ? 'text-green-400' : 'text-red-400'}>
                          {passage.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editPassage(passage);
                        }}
                                className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePassage(passage.id);
                        }}
                                className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                Chưa có bài đọc nào. Hãy tạo bài đọc mới!
              </div>
            )}
          </div>

          {/* Questions List */}
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-50">
                Câu hỏi {selectedPassage ? `- ${selectedPassage.title}` : ''}
              </h2>
              {selectedPassage && (
                <button
                  onClick={() => setShowQuestionForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Thêm câu hỏi
                </button>
              )}
            </div>
            
            {selectedPassage ? (
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="bg-gray-600 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-200 mb-2">{question.question_text}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{question.question_type}</span>
                          <span>Thứ tự: {question.order_index}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editQuestion(question)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Chọn một bài đọc để xem câu hỏi</p>
            )}
          </div>
        </div>

        {/* Passage Form Modal */}
        {showPassageForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-50 mb-4">
                {editingPassage ? 'Sửa bài đọc' : 'Thêm bài đọc mới với câu hỏi'}
              </h2>
              
              {editingPassage ? (
                // Form sửa bài đọc (giữ nguyên)
              <form onSubmit={handlePassageSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-200 mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={passageForm.title}
                    onChange={(e) => setPassageForm({...passageForm, title: e.target.value})}
                    className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-200 mb-2">Nội dung</label>
                  <textarea
                    value={passageForm.content}
                    onChange={(e) => setPassageForm({...passageForm, content: e.target.value})}
                    className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200 h-64"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-200 mb-2">Cấp độ</label>
                    <select
                      value={passageForm.level}
                      onChange={(e) => setPassageForm({...passageForm, level: e.target.value as any})}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                    >
                      <option value="beginner">Cơ bản</option>
                      <option value="intermediate">Trung bình</option>
                      <option value="advanced">Nâng cao</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-200 mb-2">Thời gian (phút)</label>
                    <input
                      type="number"
                      value={passageForm.time_limit}
                      onChange={(e) => setPassageForm({...passageForm, time_limit: parseInt(e.target.value)})}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-200 mb-2">Danh mục</label>
                  <input
                    type="text"
                    value={passageForm.category}
                    onChange={(e) => setPassageForm({...passageForm, category: e.target.value})}
                    className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={passageForm.is_active}
                    onChange={(e) => setPassageForm({...passageForm, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-gray-200">Hoạt động</label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg"
                  >
                      Cập nhật
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassageForm(false);
                      setEditingPassage(null);
                    }}
                    className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-6 py-3 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </form>
              ) : (
                // Form thêm bài đọc mới với câu hỏi
                <form onSubmit={handleNewPassageWithQuestionsSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-200 mb-2">Tiêu đề bài đọc</label>
                    <input
                      type="text"
                      value={newPassageWithQuestions.title}
                      onChange={(e) => setNewPassageWithQuestions({...newPassageWithQuestions, title: e.target.value})}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                      required
                    />
            </div>

                  <div>
                    <label className="block text-gray-200 mb-2">Nội dung bài đọc</label>
                    <textarea
                      value={newPassageWithQuestions.content}
                      onChange={(e) => setNewPassageWithQuestions({...newPassageWithQuestions, content: e.target.value})}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200 h-64"
                      required
                    />
          </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newPassageWithQuestions.is_active}
                      onChange={(e) => setNewPassageWithQuestions({...newPassageWithQuestions, is_active: e.target.checked})}
                      className="mr-2"
                    />
                    <label className="text-gray-200">Hoạt động</label>
                  </div>

                  <div className="border-t border-gray-600 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-50">Câu hỏi</h3>
                      <button
                        type="button"
                        onClick={addQuestionToNewPassage}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                      >
                        Thêm câu hỏi
                      </button>
                    </div>

                    {newPassageWithQuestions.questions.map((question, index) => (
                      <div key={index} className="bg-gray-600 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-lg font-semibold text-gray-200">Câu hỏi {index + 1}</h4>
                          {newPassageWithQuestions.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestionFromNewPassage(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Xóa
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-200 mb-2">Câu hỏi</label>
                            <textarea
                              value={question.question_text}
                              onChange={(e) => updateQuestionInNewPassage(index, 'question_text', e.target.value)}
                              className="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-gray-200 h-20"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-200 mb-2">Loại câu hỏi</label>
                              <select
                                value={question.question_type}
                                onChange={(e) => updateQuestionInNewPassage(index, 'question_type', e.target.value)}
                                className="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-gray-200"
                              >
                                <option value="multiple_choice">Trắc nghiệm</option>
                                <option value="true_false_not_given">True/False/Not Given</option>
                                <option value="yes_no_not_given">Yes/No/Not Given</option>
                                <option value="matching_headings">Matching Headings</option>
                                <option value="matching_information">Matching Information</option>
                                <option value="matching_features">Matching Features</option>
                                <option value="matching_sentence_endings">Matching Sentence Endings</option>
                                <option value="sentence_completion">Sentence Completion</option>
                                <option value="summary_completion">Summary Completion</option>
                                <option value="note_completion">Note Completion</option>
                                <option value="table_completion">Table Completion</option>
                                <option value="flow_chart_completion">Flow-chart Completion</option>
                                <option value="diagram_labelling">Diagram Labelling</option>
                                <option value="short_answer_questions">Short-Answer Questions</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-gray-200 mb-2">Thứ tự</label>
                              <input
                                type="number"
                                value={question.order_index}
                                onChange={(e) => updateQuestionInNewPassage(index, 'order_index', parseInt(e.target.value))}
                                className="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-gray-200"
                                min="1"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg"
                    >
                      Thêm bài đọc và câu hỏi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassageForm(false);
                        setNewPassageWithQuestions({
                          title: '',
                          content: '',
                          is_active: true,
                          questions: [
                            {
                              question_text: '',
                              question_type: 'multiple_choice',
                              options: ['', '', '', ''],
                              order_index: 1
                            }
                          ]
                        });
                      }}
                      className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-6 py-3 rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Question Form Modal */}
        {showQuestionForm && selectedPassage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-50 mb-4">
                {editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}
              </h2>
              
              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-200 mb-2">Câu hỏi</label>
                  <textarea
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({...questionForm, question_text: e.target.value})}
                    className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200 h-24"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-200 mb-2">Loại câu hỏi</label>
                    <select
                      value={questionForm.question_type}
                      onChange={(e) => setQuestionForm({...questionForm, question_type: e.target.value as any})}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                    >
                      <option value="multiple_choice">Trắc nghiệm</option>
                      <option value="true_false_not_given">True/False/Not Given</option>
                      <option value="yes_no_not_given">Yes/No/Not Given</option>
                      <option value="matching_headings">Matching Headings</option>
                      <option value="matching_information">Matching Information</option>
                      <option value="matching_features">Matching Features</option>
                      <option value="matching_sentence_endings">Matching Sentence Endings</option>
                      <option value="sentence_completion">Sentence Completion</option>
                      <option value="summary_completion">Summary Completion</option>
                      <option value="note_completion">Note Completion</option>
                      <option value="table_completion">Table Completion</option>
                      <option value="flow_chart_completion">Flow-chart Completion</option>
                      <option value="diagram_labelling">Diagram Labelling</option>
                      <option value="short_answer_questions">Short-Answer Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-200 mb-2">Thứ tự</label>
                    <input
                      type="number"
                      value={questionForm.order_index}
                      onChange={(e) => setQuestionForm({...questionForm, order_index: parseInt(e.target.value)})}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-200 mb-2">Note (tùy chọn)</label>
                  <input
                    type="text"
                    value={questionForm.note}
                    onChange={(e) => setQuestionForm({...questionForm, note: e.target.value})}
                    className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                    placeholder="VD: Choose ONE WORD ONLY from the passage for each answer"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
                  >
                    {editingQuestion ? 'Cập nhật' : 'Thêm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuestionForm(false);
                      setEditingQuestion(null);
                    }}
                    className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-6 py-3 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* IELTS Reading Test Form Modal */}
        {showIeltsTestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-50 mb-4">
                Tạo đề IELTS Reading hoàn chỉnh
              </h2>
              
              <form onSubmit={handleIeltsTestSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-200 mb-2">Tiêu đề đề thi</label>
                      <input
                        type="text"
                      value={ieltsReadingTest.title}
                      onChange={(e) => setIeltsReadingTest({...ieltsReadingTest, title: e.target.value})}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                      placeholder="VD: IELTS Reading Test 1"
                        required
                      />
                  </div>

                <div>
                    <label className="block text-gray-200 mb-2">Mô tả</label>
                  <input
                    type="text"
                      value={ieltsReadingTest.description}
                      onChange={(e) => setIeltsReadingTest({...ieltsReadingTest, description: e.target.value})}
                    className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                      placeholder="VD: Đề thi IELTS Reading mẫu"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ieltsReadingTest.is_active}
                    onChange={(e) => setIeltsReadingTest({...ieltsReadingTest, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-gray-200">Hoạt động</label>
                </div>

                <div className="border-t border-gray-600 pt-6">
                  <h3 className="text-xl font-bold text-gray-50 mb-4">3 Task (Passages)</h3>
                  
                  
                  {ieltsReadingTest.passages.map((passage, passageIndex) => (
                    <div key={passageIndex} className="bg-gray-600 p-6 rounded-lg mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-200">Task {passageIndex + 1}</h4>
                        <span className="text-sm text-gray-400">Hệ thống sẽ tự động phân loại câu hỏi</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-200 mb-2">Tiêu đề bài đọc</label>
                          <input
                            type="text"
                            value={passage.title}
                            onChange={(e) => {
                              const newPassages = [...ieltsReadingTest.passages];
                              newPassages[passageIndex].title = e.target.value;
                              setIeltsReadingTest({...ieltsReadingTest, passages: newPassages});
                            }}
                            className="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-gray-200"
                            placeholder={`Tiêu đề Task ${passageIndex + 1}`}
                    required
                  />
                </div>

                <div>
                          <label className="block text-gray-200 mb-2">Nội dung bài đọc</label>
                  <textarea
                            value={passage.content}
                            onChange={(e) => {
                              const newPassages = [...ieltsReadingTest.passages];
                              newPassages[passageIndex].content = e.target.value;
                              setIeltsReadingTest({...ieltsReadingTest, passages: newPassages});
                            }}
                            className="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-gray-200 h-48"
                            placeholder={`Nội dung bài đọc Task ${passageIndex + 1}...`}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-gray-200 mb-2">Câu hỏi thô (cần sắp xếp)</label>
                          <textarea
                            value={rawQuestions[passageIndex]}
                            onChange={(e) => {
                              const newRawQuestions = [...rawQuestions];
                              newRawQuestions[passageIndex] = e.target.value;
                              setRawQuestions(newRawQuestions);
                            }}
                            className="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-gray-200 h-32"
                            placeholder={`Nhập câu hỏi thô cho Task ${passageIndex + 1}...`}
                          />
                        </div>

                        <div className="border-t border-gray-500 pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-md font-semibold text-gray-200">Câu hỏi</h5>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => generateQuestionsWithGemini(passageIndex)}
                                disabled={isGeneratingQuestions === passageIndex || !passage.content.trim() || !rawQuestions[passageIndex].trim()}
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white px-3 py-1 rounded text-sm flex items-center"
                              >
                                {isGeneratingQuestions === passageIndex ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                    Đang biên dịch...
                                  </>
                                ) : (
                                  <>
                                    🤖 Biên dịch câu hỏi
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => addQuestionToPassage(passageIndex)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Thêm câu hỏi
                              </button>
                            </div>
                          </div>

                          {passage.questions.map((question, questionIndex) => (
                            <div key={questionIndex} className="bg-gray-700 p-4 rounded-lg mb-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-400">Câu hỏi {question.order_index}</span>
                                <div className="flex items-center space-x-2">
                                  {question.note && (
                                    <span className="text-xs text-yellow-400">
                                      Note: {question.note}
                                    </span>
                                  )}
                                  <div className="flex items-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => moveQuestionUp(passageIndex, questionIndex)}
                                      disabled={questionIndex === 0}
                                      className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 text-sm px-1"
                                      title="Di chuyển lên"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveQuestionDown(passageIndex, questionIndex)}
                                      disabled={questionIndex === passage.questions.length - 1}
                                      className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 text-sm px-1"
                                      title="Di chuyển xuống"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeQuestionFromPassage(passageIndex, questionIndex)}
                                      className="text-red-400 hover:text-red-300 text-sm"
                                      title="Xóa câu hỏi"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-gray-200 mb-1 text-sm">Câu hỏi</label>
                                  <textarea
                                    value={question.question_text}
                                    onChange={(e) => updateQuestionInPassage(passageIndex, questionIndex, 'question_text', e.target.value)}
                                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-gray-200 h-16 text-sm"
                                    placeholder="Nhập câu hỏi..."
                                    required
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-gray-200 mb-1 text-sm">Loại câu hỏi</label>
                                  <select
                                    value={question.question_type || 'multiple_choice'}
                                    onChange={(e) => updateQuestionInPassage(passageIndex, questionIndex, 'question_type', e.target.value)}
                                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-gray-200 text-sm"
                                  >
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="true_false_not_given">True/False/Not Given</option>
                                    <option value="yes_no_not_given">Yes/No/Not Given</option>
                                    <option value="matching_headings">Matching Headings</option>
                                    <option value="matching_information">Matching Information</option>
                                    <option value="matching_features">Matching Features</option>
                                    <option value="matching_sentence_endings">Matching Sentence Endings</option>
                                    <option value="sentence_completion">Sentence Completion</option>
                                    <option value="summary_completion">Summary Completion</option>
                                    <option value="note_completion">Note Completion</option>
                                    <option value="table_completion">Table Completion</option>
                                    <option value="flow_chart_completion">Flow-chart Completion</option>
                                    <option value="diagram_labelling">Diagram Labelling</option>
                                    <option value="short_answer_questions">Short-Answer Questions</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-gray-200 mb-1 text-sm">Note (tùy chọn)</label>
                                  <input
                                    type="text"
                                    value={question.note || ''}
                                    onChange={(e) => updateQuestionInPassage(passageIndex, questionIndex, 'note', e.target.value)}
                                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-gray-200 text-sm"
                                    placeholder="VD: Choose ONE WORD ONLY from the passage for each answer"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-600 pt-6">
                  <h3 className="text-xl font-bold text-gray-50 mb-4">Đáp án toàn bộ đề thi</h3>
                  
                  <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4 mb-6">
                    <h4 className="text-yellow-200 font-semibold mb-2">💡 Hướng dẫn biên dịch đáp án:</h4>
                    <ul className="text-yellow-100 text-sm space-y-1">
                      <li>• <strong>🤖 Biên dịch đáp án:</strong> Nhập đáp án thô (có thể bằng tiếng Việt) và nhấn nút để tự động biên dịch sang tiếng Anh</li>
                      <li>• <strong>Đáp án thô:</strong> Có thể nhập theo format: "1. A, 2. True, 3. environment, 4. B..." cho toàn bộ đề thi</li>
                      <li>• <strong>Kết quả:</strong> Hệ thống sẽ tự động biên dịch và sắp xếp đáp án theo thứ tự</li>
                      <li>• <strong>Chỉnh sửa:</strong> Có thể chỉnh sửa đáp án sau khi biên dịch</li>
                      <li>• <strong>Lưu ý:</strong> Đáp án này sẽ áp dụng cho toàn bộ đề thi (cả 3 Task)</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-200 mb-2">Đáp án thô (cần biên dịch)</label>
                      <textarea
                        value={rawAnswers}
                        onChange={(e) => setRawAnswers(e.target.value)}
                        className="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-gray-200 h-32"
                        placeholder="Nhập đáp án thô... Ví dụ: 1. A, 2. True, 3. environment, 4. B, 5. False... (cho toàn bộ đề thi)"
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        Có thể nhập bằng tiếng Việt hoặc tiếng Anh, hệ thống sẽ tự động biên dịch và sắp xếp cho toàn bộ đề thi
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <label className="block text-gray-200 mb-2">Đáp án đã biên dịch</label>
                        <button
                          type="button"
                          onClick={generateAnswersWithGemini}
                          disabled={isGeneratingAnswers || !rawAnswers.trim() || !ieltsReadingTest.passages[0].content.trim()}
                          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-500 text-white px-4 py-2 rounded text-sm flex items-center"
                        >
                          {isGeneratingAnswers ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Đang biên dịch...
                            </>
                          ) : (
                            <>
                              🤖 Biên dịch đáp án
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-gray-700 border border-gray-500 rounded-lg p-3 h-32 overflow-y-auto">
                        {ieltsReadingTest.all_answers && ieltsReadingTest.all_answers.length > 0 ? (
                          <div className="space-y-2">
                            {ieltsReadingTest.all_answers.map((answer, index) => (
                              <div key={index} className="text-sm text-gray-200">
                                <span className="font-semibold">{answer.question_number}:</span> {answer.answer}
                                {answer.explanation && (
                                  <div className="text-xs text-gray-400 ml-4 mt-1">
                                    {answer.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">
                            Chưa có đáp án. Hãy nhập đáp án thô và nhấn "Biên dịch đáp án"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                  >
                    Tạo đề IELTS Reading
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowIeltsTestForm(false);
                      setIeltsReadingTest({
                        title: '',
                        description: '',
                        is_active: true,
                        passages: [
                          { title: '', content: '', questions: [] },
                          { title: '', content: '', questions: [] },
                          { title: '', content: '', questions: [] }
                        ],
                        all_answers: []
                      });
                      setRawAnswers('');
                      setRawQuestions(['', '', '']);
                    }}
                    className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-6 py-3 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IeltsReadingAdminPage; 