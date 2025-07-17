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
  question_type: 'multiple_choice' | 'multiple_choice_5' | 'multiple_choice_group' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'diagram_labelling' | 'short_answer_questions';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  note?: string;
  order_index: number;
  group_id?: string; // Để nhóm các câu hỏi cùng loại
}

// Thêm interface cho đề IELTS Reading hoàn chỉnh
interface IeltsReadingTest {
  title: string;
  description: string;
  is_active: boolean;
  passages: {
    title: string;
    content: string;
    groups: Group[];
  }[];
  all_answers?: {
    question_number: string;
    answer: string;
    explanation?: string;
    order_index: number;
  }[];
}

// 1. Định nghĩa interface Group
interface Group {
  questionType: string;
  content: string;
  questions: {
    questionText: string;
    options?: string[];
    explanation?: string;
    note?: string;
    orderIndex: number;
  }[];
}

// Interface cho cấu trúc JSON mới
interface NewIeltsReadingData {
  metadata: {
    id: number;
    title: string;
    link: string;
    slug: string;
  };
  content: {
    readingPassage: {
      title: string;
      paragraphs: string[];
    };
    questionGroups: {
      type: string;
      range: string;
      instructions: string;
      questions: {
        id: number;
        content: string;
        answer: string;
        guide: string;
        options?: {
          A?: string;
          B?: string;
          C?: string;
          D?: string;
          E?: string;
        };
      }[];
    }[];
  };
  summary: {
    question_types: string[];
    total_questions: number;
  };
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
    question_type: 'multiple_choice' as 'multiple_choice' | 'multiple_choice_5' | 'multiple_choice_group' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'diagram_labelling' | 'short_answer_questions',
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
    question_type: 'multiple_choice' as 'multiple_choice' | 'multiple_choice_5' | 'multiple_choice_group' | 'true_false' | 'fill_blank' | 'matching',
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
      { title: '', content: '', groups: [] }
    ],
    all_answers: []
  });

  // Thêm state cho form thêm nhóm câu hỏi mới
  const [newGroupForm, setNewGroupForm] = useState({
    passageIndex: 0,
    content: '',
    questionType: 'multiple_choice',
    startQuestion: 1,
    endQuestion: 7
  });

  // Thêm state cho nhập đáp án hàng loạt
  const [bulkAnswers, setBulkAnswers] = useState('');
  const [showBulkAnswerForm, setShowBulkAnswerForm] = useState(false);
  const [currentEditingGroup, setCurrentEditingGroup] = useState<{passageIndex: number, groupIndex: number} | null>(null);

  const [showIeltsTestForm, setShowIeltsTestForm] = useState(false);
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  
  // Thêm state cho việc biên dịch câu hỏi
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<number | null>(null);
  
  // Thêm state cho việc biên dịch đáp án Task 3
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);
  const [rawAnswers, setRawAnswers] = useState('');

  // State cho import từ JSON/URL
  const [showImportForm, setShowImportForm] = useState(false);
  const [importType, setImportType] = useState<'file' | 'url'>('file');
  const [importUrl, setImportUrl] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);

  useEffect(() => {
    // Bỏ qua việc kiểm tra user và quyền admin
    fetchPassages();
  }, []);

  const fetchPassages = async () => {
    try {
      setLoading(true);
      console.log('Đang tải danh sách bài đọc...');
      
      const response = await fetch('/api/admin/ielts-reading/passages', {
        headers: {
          // Không gửi firebase_uid
        }
      });
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Dữ liệu nhận được:', data);
        
        if (data.passages && Array.isArray(data.passages)) {
          console.log(`Số lượng bài đọc: ${data.passages.length}`);
          setPassages(data.passages);
          setGroupedPassages(data.groupedPassages || {});
        } else {
          console.error('Định dạng dữ liệu không đúng:', data);
          alert('Lỗi khi tải danh sách bài đọc: Định dạng dữ liệu không đúng');
        }
      } else {
        console.error('Lỗi khi tải bài đọc, mã trạng thái:', response.status);
        const errorText = await response.text();
        console.error('Chi tiết lỗi:', errorText);
        alert(`Lỗi khi tải danh sách bài đọc: ${response.status}`);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách bài đọc:', error);
      alert('Lỗi khi tải danh sách bài đọc. Vui lòng kiểm tra console để biết thêm chi tiết.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (passageId: number) => {
    try {
      const response = await fetch(`/api/admin/ielts-reading/questions/${passageId}`, {
        headers: {
          // Không gửi firebase_uid
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Xử lý cả cấu trúc cũ và mới
        if (data.groups) {
          // Cấu trúc mới: flatten groups thành questions
          const flattenedQuestions: Question[] = [];
          data.groups.forEach((group: any) => {
            group.questions.forEach((question: any) => {
              flattenedQuestions.push({
                id: question.id,
                question_text: question.question_text,
                question_type: question.question_type,
                options: question.options,
                correct_answer: question.correct_answer,
                explanation: question.explanation,
                note: question.note,
                order_index: question.order_index
              });
            });
          });
          setQuestions(flattenedQuestions);
        } else if (data.questions) {
          // Cấu trúc cũ: sử dụng trực tiếp
          setQuestions(data.questions);
        } else {
          setQuestions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    }
  };

  const saveQuestionOrder = async (passageId: number, updatedQuestions: Question[]) => {
    try {
      const response = await fetch(`/api/admin/ielts-reading/questions/${passageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify({
          questions: updatedQuestions.map((q, index) => ({
            id: q.id,
            order_index: index + 1
          }))
        })
      });

      if (response.ok) {
        console.log('Thứ tự câu hỏi đã được lưu');
      } else {
        console.error('Lỗi khi lưu thứ tự câu hỏi');
      }
    } catch (error) {
      console.error('Error saving question order:', error);
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
  const autoClassifyQuestion = (questionText: string): 'multiple_choice' | 'multiple_choice_5' | 'multiple_choice_group' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'diagram_labelling' | 'short_answer_questions' => {
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
    } else if (questionType === 'multiple_choice_5') {
      // Tạo options cho trắc nghiệm 5 đáp án
      return ['A', 'B', 'C', 'D', 'E'];
    } else if (questionType === 'multiple_choice_group') {
      // Tạo options cho nhóm câu hỏi trắc nghiệm (5 đáp án, 2 câu hỏi)
      return ['A', 'B', 'C', 'D', 'E'];
    }
    return [];
  };

  // Hàm xử lý tạo đề IELTS Reading hoàn chỉnh
  const handleIeltsTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Kiểm tra nội dung cần thiết
      if (!ieltsReadingTest.title.trim()) {
        alert('Vui lòng nhập tiêu đề đề thi');
        return;
      }

      // Lọc bỏ các passage không có tiêu đề
      const validPassages = ieltsReadingTest.passages.filter(passage => 
        passage.title.trim() !== ''
      );

      if (validPassages.length === 0) {
        alert('Vui lòng nhập ít nhất một bài đọc');
        return;
      }

      const dataToSubmit = {
        ...ieltsReadingTest,
        passages: validPassages
      };

      const response = await fetch('/api/admin/ielts-reading/complete-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user?.uid || ''
        },
        body: JSON.stringify(dataToSubmit)
      });

      if (response.ok) {
        setShowIeltsTestForm(false);
        setIeltsReadingTest({
          title: '',
          description: '',
          is_active: true,
          passages: [
            { title: '', content: '', groups: [] }
          ],
          all_answers: []
        });
        setRawAnswers('');
        fetchPassages();
        alert('Tạo đề IELTS Reading thành công!');
      }
    } catch (error) {
      console.error('Error creating IELTS test:', error);
      alert('Có lỗi xảy ra khi tạo đề!');
    }
  };

  // Thêm hàm để thêm/xóa task
  const addNewPassage = () => {
    setIeltsReadingTest(prev => ({
      ...prev,
      passages: [...prev.passages, { title: '', content: '', groups: [] }]
    }));
  };

  const removePassage = (index: number) => {
    if (ieltsReadingTest.passages.length <= 1) {
      alert('Đề thi phải có ít nhất một bài đọc');
      return;
    }
    
    setIeltsReadingTest(prev => ({
      ...prev,
      passages: prev.passages.filter((_, i) => i !== index)
    }));
  };

  // Hàm để thêm nhóm câu hỏi mới
  const handleAddGroup = () => {
    const passageIndex = newGroupForm.passageIndex;
    const { content, questionType, startQuestion, endQuestion } = newGroupForm;
    
    if (!content || startQuestion > endQuestion) {
      alert('Vui lòng nhập đầy đủ thông tin và đảm bảo số câu bắt đầu nhỏ hơn số câu kết thúc');
      return;
    }

    const numQuestions = endQuestion - startQuestion + 1;
    
    // Tạo danh sách câu hỏi trống
    const questions = Array.from({ length: numQuestions }, (_, i) => ({
      questionText: '',
      options: questionType === 'multiple_choice' ? ['', '', '', ''] : 
               questionType === 'multiple_choice_5' ? ['', '', '', '', ''] :
               questionType === 'multiple_choice_group' ? ['', '', '', '', ''] : [],
      explanation: '',
      note: '',
      orderIndex: startQuestion + i
    }));

    // Thêm nhóm câu hỏi mới vào passage
    setIeltsReadingTest(prev => {
      const newPassages = [...prev.passages];
      newPassages[passageIndex].groups.push({
        content,
        questionType,
        questions
      });
      return {
        ...prev,
        passages: newPassages
      };
    });

    // Reset form
    setNewGroupForm({
      passageIndex,
      content: '',
      questionType: 'multiple_choice',
      startQuestion: endQuestion + 1,
      endQuestion: endQuestion + 7
    });
    
    setShowAddGroupForm(false);
  };

  // Hàm cập nhật câu hỏi trong group
  const updateQuestionInGroup = (passageIndex: number, groupIndex: number, questionIndex: number, field: string, value: any) => {
    setIeltsReadingTest(prev => {
      const newPassages = [...prev.passages];
      newPassages[passageIndex].groups[groupIndex].questions[questionIndex] = {
        ...newPassages[passageIndex].groups[groupIndex].questions[questionIndex],
        [field]: value
      };
      return {
        ...prev,
        passages: newPassages
      };
    });
  };

  // Hàm để xóa nhóm câu hỏi
  const deleteGroup = (passageIndex: number, groupIndex: number) => {
    if (!confirm('Bạn có chắc muốn xóa nhóm câu hỏi này?')) return;

    setIeltsReadingTest(prev => {
      const newPassages = [...prev.passages];
      newPassages[passageIndex].groups = newPassages[passageIndex].groups.filter((_, i) => i !== groupIndex);
      return {
        ...prev,
        passages: newPassages
      };
    });
  };

  // Hàm để chỉnh sửa nhóm câu hỏi
  const editGroup = (passageIndex: number, groupIndex: number) => {
    const group = ieltsReadingTest.passages[passageIndex].groups[groupIndex];
    const questions = group.questions;
    
    setNewGroupForm({
      passageIndex,
      content: group.content,
      questionType: group.questionType,
      startQuestion: questions[0].orderIndex,
      endQuestion: questions[questions.length - 1].orderIndex
    });
    
    // Xóa group cũ trước khi thêm group mới
    setIeltsReadingTest(prev => {
      const newPassages = [...prev.passages];
      newPassages[passageIndex].groups = newPassages[passageIndex].groups.filter((_, i) => i !== groupIndex);
      return {
        ...prev,
        passages: newPassages
      };
    });
    
    setShowAddGroupForm(true);
  };

  // Hàm để mở form nhập đáp án hàng loạt
  const openBulkAnswerForm = (passageIndex: number, groupIndex: number) => {
    setCurrentEditingGroup({ passageIndex, groupIndex });
    setBulkAnswers('');
    setShowBulkAnswerForm(true);
  };

  // Hàm để xử lý đáp án hàng loạt
  const handleBulkAnswers = () => {
    if (!currentEditingGroup) return;
    
    const { passageIndex, groupIndex } = currentEditingGroup;
    const group = ieltsReadingTest.passages[passageIndex].groups[groupIndex];
    const questions = group.questions;
    
    // Xử lý chuỗi đáp án
    const answers = bulkAnswers
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Loại bỏ số thứ tự và dấu chấm/phẩy ở đầu
        return line.trim().replace(/^\d+[\.,]\s*/, '').trim();
      });
    
    // Thêm vào all_answers
    setIeltsReadingTest(prev => {
      const newTest = {...prev};
      
      // Tạo mảng all_answers nếu chưa có
      if (!newTest.all_answers) {
        newTest.all_answers = [];
      }
      
      // Thêm các đáp án mới
      for (let i = 0; i < Math.min(answers.length, questions.length); i++) {
        const questionNumber = questions[i].orderIndex;
        
        // Kiểm tra xem đã có đáp án cho câu hỏi này chưa
        const existingAnswerIndex = newTest.all_answers.findIndex(
          a => a.question_number === questionNumber.toString()
        );
        
        if (existingAnswerIndex >= 0) {
          // Cập nhật đáp án đã có
          newTest.all_answers[existingAnswerIndex].answer = answers[i];
        } else {
          // Thêm đáp án mới
          newTest.all_answers.push({
            question_number: questionNumber.toString(),
            answer: answers[i],
            order_index: questionNumber
          });
        }
      }
      
      return newTest;
    });
    
    setShowBulkAnswerForm(false);
    alert(`Đã cập nhật ${Math.min(answers.length, questions.length)} đáp án cho nhóm câu hỏi`);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPassage) return;

    let finalType: 'multiple_choice' | 'multiple_choice_5' | 'multiple_choice_group' | 'true_false_not_given' | 'yes_no_not_given' | 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'diagram_labelling' | 'short_answer_questions';
    if (questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'multiple_choice_5' || questionForm.question_type === 'multiple_choice_group' || questionForm.question_type === 'true_false_not_given' || questionForm.question_type === 'yes_no_not_given' || questionForm.question_type === 'matching_headings' || questionForm.question_type === 'matching_information' || questionForm.question_type === 'matching_features' || questionForm.question_type === 'matching_sentence_endings' || questionForm.question_type === 'sentence_completion' || questionForm.question_type === 'summary_completion' || questionForm.question_type === 'note_completion' || questionForm.question_type === 'table_completion' || questionForm.question_type === 'flow_chart_completion' || questionForm.question_type === 'diagram_labelling' || questionForm.question_type === 'short_answer_questions') {
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

  // Function xử lý import từ file JSON
  const handleFileImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setImportPreview(data);
      return data;
    } catch (error) {
      console.error('Lỗi khi đọc file JSON:', error);
      alert('Lỗi khi đọc file JSON. Vui lòng kiểm tra định dạng file.');
      return null;
    }
  };

  // Function xử lý import từ URL
  const handleUrlImport = async (url: string) => {
    try {
      // Kiểm tra xem có phải là URL WordPress không
      if (url.includes('izone.edu.vn') || url.includes('wordpress') || url.includes('wp-json')) {
        // Sử dụng endpoint mới để parse HTML từ URL
        const response = await fetch('/api/admin/ielts-reading/import-from-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url })
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Import thành công! Đã tạo bài đọc với ID: ${result.passageId}`);
          setShowImportForm(false);
          setImportUrl('');
          fetchPassages(); // Refresh danh sách
          return result;
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Lỗi khi import từ URL');
        }
      } else {
        // Xử lý URL JSON thông thường
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setImportPreview(data);
        return data;
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu từ URL:', error);
      alert(`Lỗi khi tải dữ liệu từ URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // Function xử lý preview import
  const handleImportPreview = async () => {
    setIsImporting(true);
    try {
      let data = null;
      
      if (importType === 'file' && importFile) {
        data = await handleFileImport(importFile);
      } else if (importType === 'url' && importUrl) {
        data = await handleUrlImport(importUrl);
      }
      
      if (data) {
        setImportPreview(data);
      }
    } catch (error) {
      console.error('Lỗi khi preview import:', error);
      alert('Lỗi khi xử lý dữ liệu import.');
    } finally {
      setIsImporting(false);
    }
  };

  // Function xử lý import dữ liệu vào hệ thống
  const handleImportData = async () => {
    if (!importPreview) {
      alert('Vui lòng preview dữ liệu trước khi import.');
      return;
    }

    setIsImporting(true);
    try {
      // Gửi dữ liệu đến API để import
      const response = await fetch('/api/admin/ielts-reading/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importPreview)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Import thành công! Đã tạo ${result.passagesCreated} bài đọc và ${result.questionsCreated} câu hỏi.`);
        setShowImportForm(false);
        setImportPreview(null);
        setImportFile(null);
        setImportUrl('');
        fetchPassages(); // Refresh danh sách
      } else {
        const error = await response.json();
        alert(`Lỗi khi import: ${error.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi import dữ liệu:', error);
      alert('Lỗi khi import dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsImporting(false);
    }
  };

  // Function xử lý thay đổi file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportPreview(null);
    }
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
              onClick={() => setShowImportForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Import từ JSON/URL
            </button>
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
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowQuestionForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Thêm câu hỏi
                  </button>
                  {questions.length > 1 && (
                    <button
                      onClick={() => {
                        const sortedQuestions = [...questions].sort((a, b) => a.order_index - b.order_index);
                        setQuestions(sortedQuestions);
                        if (selectedPassage) {
                          saveQuestionOrder(selectedPassage.id, sortedQuestions);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Sắp xếp câu hỏi
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {selectedPassage ? (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="bg-gray-600 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-200 mb-2">{question.question_text}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{(() => {
                                                     const typeMap: {[key: string]: string} = {
                             'multiple_choice': 'Trắc nghiệm (4 đáp án)',
                             'multiple_choice_5': 'Trắc nghiệm (5 đáp án, 2 đáp án đúng)',
                             'multiple_choice_group': 'Nhóm trắc nghiệm (5 đáp án, 2 câu hỏi)',
                             'true_false_not_given': 'True/False/Not Given',
                             'yes_no_not_given': 'Yes/No/Not Given',
                             'matching_headings': 'Matching Headings',
                             'matching_information': 'Matching Information',
                             'matching_features': 'Matching Features',
                             'matching_sentence_endings': 'Matching Sentence Endings',
                             'sentence_completion': 'Sentence Completion',
                             'summary_completion': 'Summary Completion',
                             'note_completion': 'Note Completion',
                             'table_completion': 'Table Completion',
                             'flow_chart_completion': 'Flow-chart Completion',
                             'diagram_labelling': 'Diagram Labelling',
                             'short_answer_questions': 'Short-Answer Questions'
                           };
                          return typeMap[question.question_type] || question.question_type;
                        })()}</span>
                          <span>Thứ tự: {question.order_index}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {index > 0 && (
                          <button
                            onClick={() => {
                              const newQuestions = [...questions];
                              [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
                              newQuestions.forEach((q, i) => { q.order_index = i + 1; });
                              setQuestions(newQuestions);
                              if (selectedPassage) {
                                saveQuestionOrder(selectedPassage.id, newQuestions);
                              }
                            }}
                            className="text-yellow-400 hover:text-yellow-300"
                            title="Di chuyển lên"
                          >
                            ↑
                          </button>
                        )}
                        {index < questions.length - 1 && (
                          <button
                            onClick={() => {
                              const newQuestions = [...questions];
                              [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
                              newQuestions.forEach((q, i) => { q.order_index = i + 1; });
                              setQuestions(newQuestions);
                              if (selectedPassage) {
                                saveQuestionOrder(selectedPassage.id, newQuestions);
                              }
                            }}
                            className="text-yellow-400 hover:text-yellow-300"
                            title="Di chuyển xuống"
                          >
                            ↓
                          </button>
                        )}
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
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        let newOptions = questionForm.options;
                        
                        // Tự động thay đổi số lượng options theo loại câu hỏi
                        if (newType === 'multiple_choice') {
                          newOptions = ['', '', '', ''];
                        } else if (newType === 'multiple_choice_5') {
                          newOptions = ['', '', '', '', ''];
                        } else if (newType === 'multiple_choice_group') {
                          newOptions = ['', '', '', '', ''];
                        }
                        
                        setQuestionForm({...questionForm, question_type: newType, options: newOptions});
                      }}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                    >
                      <option value="multiple_choice">Trắc nghiệm (4 đáp án)</option>
                      <option value="multiple_choice_5">Trắc nghiệm (5 đáp án, 2 đáp án đúng)</option>
                      <option value="multiple_choice_group">Nhóm trắc nghiệm (5 đáp án, 2 câu hỏi)</option>
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

                {/* Hiển thị options cho câu hỏi trắc nghiệm */}
                {(questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'multiple_choice_5' || questionForm.question_type === 'multiple_choice_group') && (
                  <div>
                    <label className="block text-gray-200 mb-2">Các lựa chọn</label>
                    <div className="grid grid-cols-2 gap-2">
                      {questionForm.options.map((option, index) => (
                        <input
                          key={index}
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionForm.options];
                            newOptions[index] = e.target.value;
                            setQuestionForm({...questionForm, options: newOptions});
                          }}
                          className="p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                          placeholder={`Tùy chọn ${String.fromCharCode(65 + index)}`}
                        />
                      ))}
                    </div>
                    {questionForm.question_type === 'multiple_choice_5' && (
                      <div className="mt-2 text-sm text-yellow-400">
                        ⚠️ Loại câu hỏi này có 5 đáp án và 2 đáp án đúng. Hãy nhập đáp án đúng dưới dạng "A,B" (ví dụ: "A,C")
                      </div>
                    )}
                    {questionForm.question_type === 'multiple_choice_group' && (
                      <div className="mt-2 text-sm text-blue-400">
                        ℹ️ Loại câu hỏi này có 5 đáp án chung cho 2 câu hỏi. Mỗi câu hỏi chọn 1 đáp án. Hãy nhập đáp án đúng dưới dạng "A" cho câu 1, "B" cho câu 2
                      </div>
                    )}
                  </div>
                )}

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
                    <label className="block text-gray-200 mb-2">Tiêu đề đề thi <span className="text-red-500">*</span></label>
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-50">Tasks (Passages)</h3>
                    <button
                      type="button"
                      onClick={addNewPassage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center text-sm"
                    >
                      + Thêm Task
                    </button>
                  </div>
                  
                  {ieltsReadingTest.passages.map((passage, passageIndex) => (
                    <div key={passageIndex} className="bg-gray-600 p-6 rounded-lg mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-200">Task {passageIndex + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removePassage(passageIndex)}
                          className="text-red-400 hover:text-red-300 px-2 py-1 rounded"
                        >
                          Xóa Task
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-200 mb-2">Tiêu đề bài đọc <span className="text-red-500">*</span></label>
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
                          />
                        </div>

                        <div className="border-t border-gray-500 pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-md font-semibold text-gray-200">Nhóm câu hỏi</h5>
                            <button
                              type="button"
                              onClick={() => {
                                setNewGroupForm({
                                  passageIndex,
                                  content: '',
                                  questionType: 'multiple_choice',
                                  startQuestion: 1,
                                  endQuestion: 7
                                });
                                setShowAddGroupForm(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center"
                            >
                              Thêm nhóm câu hỏi
                            </button>
                          </div>

                          {/* Hiển thị danh sách nhóm câu hỏi */}
                          {passage.groups.map((group, groupIndex) => (
                            <div key={groupIndex} className="bg-gray-700 p-4 rounded-lg mb-6">
                              <div className="flex justify-between items-center mb-3">
                                <h6 className="font-semibold text-gray-200">
                                  Nhóm {groupIndex + 1}: {group.questions.length} câu hỏi (từ {group.questions[0]?.orderIndex || 0} đến {group.questions[group.questions.length - 1]?.orderIndex || 0})
                                </h6>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => editGroup(passageIndex, groupIndex)}
                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteGroup(passageIndex, groupIndex)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>

                              <div className="bg-gray-800 p-3 rounded mb-3">
                                <div className="text-gray-400 text-sm mb-1">Nội dung nhóm câu hỏi:</div>
                                <div className="text-gray-200 whitespace-pre-line">{group.content}</div>
                              </div>

                              <div className="bg-gray-800 p-3 rounded mb-3">
                                <div className="text-gray-400 text-sm mb-1">Loại câu hỏi:</div>
                                <div className="text-gray-200">{group.questionType}</div>
                              </div>

                              <div className="mt-4 flex justify-between items-center">
                                <h6 className="font-semibold text-gray-300">Câu hỏi:</h6>
                                <button
                                  type="button"
                                  onClick={() => openBulkAnswerForm(passageIndex, groupIndex)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                                >
                                  Nhập đáp án hàng loạt
                                </button>
                              </div>
                              <div>
                                {group.questions.map((question, questionIndex) => (
                                  <div key={questionIndex} className="bg-gray-800 p-3 rounded-lg mb-2">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-gray-300">Câu {question.orderIndex}</span>
                                    </div>
                                    <div className="space-y-2">
                                      <textarea
                                        value={question.questionText}
                                        onChange={(e) => updateQuestionInGroup(passageIndex, groupIndex, questionIndex, 'questionText', e.target.value)}
                                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200 h-16"
                                        placeholder="Nhập nội dung câu hỏi..."
                                        required
                                      />
                                      {(group.questionType === 'multiple_choice' || group.questionType === 'multiple_choice_5' || group.questionType === 'multiple_choice_group') && question.options && (
                                        <div className="grid grid-cols-2 gap-2">
                                          {question.options.map((option, optionIndex) => (
                                            <input
                                              key={optionIndex}
                                              type="text"
                                              value={option}
                                              onChange={(e) => {
                                                const newOptions = [...question.options!];
                                                newOptions[optionIndex] = e.target.value;
                                                updateQuestionInGroup(passageIndex, groupIndex, questionIndex, 'options', newOptions);
                                              }}
                                              className="p-2 bg-gray-700 border border-gray-600 rounded text-gray-200"
                                              placeholder={`Tùy chọn ${String.fromCharCode(65 + optionIndex)}`}
                                            />
                                          ))}
                                        </div>
                                      )}
                                      <input
                                        type="text"
                                        value={question.note || ''}
                                        onChange={(e) => updateQuestionInGroup(passageIndex, groupIndex, questionIndex, 'note', e.target.value)}
                                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-200"
                                        placeholder="Ghi chú (không bắt buộc)"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Hiển thị đáp án đã nhập */}
                              {ieltsReadingTest.all_answers && ieltsReadingTest.all_answers.length > 0 && (
                                <div className="mt-4">
                                  <div className="text-gray-400 text-sm mb-2">Đáp án đã nhập:</div>
                                  <div className="bg-gray-700 p-3 rounded">
                                    {group.questions.map((question, qIndex) => {
                                      const answer = ieltsReadingTest.all_answers?.find(
                                        a => a.question_number === question.orderIndex.toString()
                                      );
                                      return answer ? (
                                        <div key={qIndex} className="mb-1 text-sm">
                                          <span className="text-gray-300">{question.orderIndex}. </span>
                                          <span className="text-green-400">{answer.answer}</span>
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {passage.groups.length === 0 && (
                            <div className="text-center text-gray-400 py-8">
                              Chưa có nhóm câu hỏi nào. Hãy thêm nhóm câu hỏi!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                          { title: '', content: '', groups: [] }
                        ],
                        all_answers: []
                      });
                      setRawAnswers('');
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

        {/* Modal thêm nhóm câu hỏi */}
        {showAddGroupForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-bold text-gray-50 mb-4">
                Thêm nhóm câu hỏi mới
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-200 mb-2">Nội dung nhóm câu hỏi</label>
                  <textarea
                    value={newGroupForm.content}
                    onChange={(e) => setNewGroupForm({...newGroupForm, content: e.target.value})}
                    className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200 h-40"
                    placeholder="Nhập nội dung cho nhóm câu hỏi (ví dụ: đoạn văn, bảng biểu, danh sách, v.v.)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-200 mb-2">Loại câu hỏi</label>
                  <select
                    value={newGroupForm.questionType}
                    onChange={(e) => setNewGroupForm({...newGroupForm, questionType: e.target.value})}
                    className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                  >
                    <option value="multiple_choice">Multiple Choice (4 đáp án)</option>
                    <option value="multiple_choice_5">Multiple Choice (5 đáp án, 2 đáp án đúng)</option>
                    <option value="multiple_choice_group">Multiple Choice Group (5 đáp án, 2 câu hỏi)</option>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-200 mb-2">Câu bắt đầu</label>
                    <input
                      type="number"
                      value={newGroupForm.startQuestion}
                      onChange={(e) => setNewGroupForm({...newGroupForm, startQuestion: parseInt(e.target.value)})}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-200 mb-2">Câu kết thúc</label>
                    <input
                      type="number"
                      value={newGroupForm.endQuestion}
                      onChange={(e) => setNewGroupForm({...newGroupForm, endQuestion: parseInt(e.target.value)})}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                      min={newGroupForm.startQuestion}
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={handleAddGroup}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
                  >
                    Thêm nhóm câu hỏi
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddGroupForm(false)}
                    className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-6 py-3 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal nhập đáp án hàng loạt */}
        {showBulkAnswerForm && currentEditingGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-bold text-gray-50 mb-4">
                Nhập đáp án hàng loạt
              </h2>
              
              <div className="space-y-4">
                <p className="text-gray-300">
                  Nhập danh sách đáp án, mỗi dòng một đáp án theo định dạng:
                  <br />
                  <code className="bg-gray-800 px-2 py-1 rounded">1. Đáp án</code>
                  <br />
                  <code className="bg-gray-800 px-2 py-1 rounded">2. Đáp án</code>
                  <br />
                  Đáp án sẽ được ghép với câu hỏi theo thứ tự.
                </p>

                <div>
                  <textarea
                    value={bulkAnswers}
                    onChange={(e) => setBulkAnswers(e.target.value)}
                    className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200 h-64 font-mono"
                    placeholder="1. Đáp án câu 1&#10;2. Đáp án câu 2&#10;3. Đáp án câu 3..."
                  />
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={handleBulkAnswers}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
                  >
                    Lưu đáp án
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkAnswerForm(false)}
                    className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-6 py-3 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Import từ JSON/URL */}
        {showImportForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-50 mb-4">
                Import từ JSON/URL
              </h2>
              
              <div className="space-y-6">
                {/* Chọn loại import */}
                <div>
                  <label className="block text-gray-200 mb-2">Chọn loại import:</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="file"
                        checked={importType === 'file'}
                        onChange={(e) => setImportType(e.target.value as 'file' | 'url')}
                        className="mr-2"
                      />
                      <span className="text-gray-200">File JSON</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="url"
                        checked={importType === 'url'}
                        onChange={(e) => setImportType(e.target.value as 'file' | 'url')}
                        className="mr-2"
                      />
                      <span className="text-gray-200">URL</span>
                    </label>
                  </div>
                </div>

                {/* Input cho file hoặc URL */}
                {importType === 'file' ? (
                  <div>
                    <label className="block text-gray-200 mb-2">Chọn file JSON:</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                    />
                    {importFile && (
                      <p className="text-green-400 text-sm mt-2">
                        Đã chọn: {importFile.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-gray-200 mb-2">Nhập URL:</label>
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://www.izone.edu.vn/luyen-thi-ielts/giai-de-cam-19-the-pirates-of-the-ancient-mediterranean/"
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-200"
                    />
                  </div>
                )}

                {/* Nút Preview */}
                <div>
                  <button
                    onClick={handleImportPreview}
                    disabled={isImporting || (importType === 'file' && !importFile) || (importType === 'url' && !importUrl)}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg"
                  >
                    {isImporting ? 'Đang xử lý...' : 'Preview dữ liệu'}
                  </button>
                </div>

                {/* Preview dữ liệu */}
                {importPreview && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-200">Preview dữ liệu:</h3>
                    <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                        {JSON.stringify(importPreview, null, 2)}
                      </pre>
                    </div>
                    
                    {/* Thông tin tóm tắt */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-200 mb-2">Thông tin tóm tắt:</h4>
                      <div className="text-gray-300 text-sm space-y-1">
                        {/* Cấu trúc JSON mới */}
                        {importPreview.metadata && importPreview.content && (
                          <>
                            <p><strong>Tiêu đề:</strong> {importPreview.metadata.title}</p>
                            <p><strong>ID:</strong> {importPreview.metadata.id}</p>
                            <p><strong>Link:</strong> {importPreview.metadata.link}</p>
                            {importPreview.content.readingPassage && (
                              <p><strong>Bài đọc:</strong> {importPreview.content.readingPassage.title}</p>
                            )}
                            {importPreview.content.questionGroups && (
                              <p><strong>Số nhóm câu hỏi:</strong> {importPreview.content.questionGroups.length}</p>
                            )}
                            {importPreview.summary && (
                              <>
                                <p><strong>Tổng số câu hỏi:</strong> {importPreview.summary.total_questions}</p>
                                <p><strong>Loại câu hỏi:</strong> {importPreview.summary.question_types?.join(', ')}</p>
                              </>
                            )}
                            {importPreview.content.questionGroups && importPreview.content.questionGroups.length > 0 && (
                              <div>
                                <p><strong>Chi tiết nhóm câu hỏi:</strong></p>
                                {importPreview.content.questionGroups.map((group: any, index: number) => (
                                  <div key={index} className="ml-4 text-gray-400">
                                    <p>• Nhóm {index + 1} ({group.type}): {group.range} - {group.questions?.length || 0} câu hỏi</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Cấu trúc JSON cũ */}
                        {!importPreview.metadata && importPreview.title && (
                          <p><strong>Tiêu đề:</strong> {
                            typeof importPreview.title === 'object' && importPreview.title.rendered 
                              ? importPreview.title.rendered 
                              : importPreview.title
                          }</p>
                        )}
                        {!importPreview.metadata && importPreview.description && (
                          <p><strong>Mô tả:</strong> {
                            typeof importPreview.description === 'object' && importPreview.description.rendered 
                              ? importPreview.description.rendered 
                              : importPreview.description
                          }</p>
                        )}
                        {!importPreview.metadata && importPreview.passages && (
                          <p><strong>Số bài đọc:</strong> {importPreview.passages.length}</p>
                        )}
                        {!importPreview.metadata && importPreview.all_answers && (
                          <p><strong>Số câu hỏi:</strong> {importPreview.all_answers.length}</p>
                        )}
                        {!importPreview.metadata && importPreview.passages && importPreview.passages.length > 0 && (
                          <div>
                            <p><strong>Chi tiết bài đọc:</strong></p>
                            {importPreview.passages.map((passage: any, index: number) => (
                              <div key={index} className="ml-4 text-gray-400">
                                <p>• Bài {index + 1}: {
                                  typeof passage.title === 'object' && passage.title.rendered 
                                    ? passage.title.rendered 
                                    : passage.title
                                }</p>
                                {passage.groups && (
                                  <p className="ml-4">- {passage.groups.length} nhóm câu hỏi</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nút Import */}
                    <div>
                      <button
                        onClick={handleImportData}
                        disabled={isImporting}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg"
                      >
                        {isImporting ? 'Đang import...' : 'Import vào hệ thống'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Hướng dẫn */}
                <div className="bg-blue-900 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-200 mb-2">Hướng dẫn sử dụng:</h4>
                  <div className="text-blue-100 text-sm space-y-2">
                    <p><strong>Định dạng JSON hỗ trợ:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><strong>Cấu trúc JSON mới:</strong> Với metadata, content.readingPassage, content.questionGroups, summary</li>
                      <li>File JSON từ izone.edu.vn hoặc các nguồn tương tự</li>
                      <li>File JSON có cấu trúc IELTS Reading test</li>
                      <li>URL trả về JSON data</li>
                    </ul>
                    <p><strong>Cấu trúc JSON mới hỗ trợ:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>metadata: thông tin bài đọc (id, title, link, slug)</li>
                      <li>content.readingPassage: bài đọc với title và paragraphs</li>
                      <li>content.questionGroups: các nhóm câu hỏi với type, range, instructions, questions</li>
                      <li>summary: tóm tắt loại câu hỏi và tổng số câu hỏi</li>
                    </ul>
                    <p><strong>Import từ URL WordPress:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Hỗ trợ URL từ izone.edu.vn, wordpress.com, hoặc các trang WordPress khác</li>
                      <li>Hệ thống sẽ tự động parse HTML và trích xuất bài đọc, câu hỏi</li>
                      <li>Không cần file JSON, chỉ cần URL trang web</li>
                      <li>Ví dụ: https://www.izone.edu.vn/luyen-thi-ielts/giai-de-cam-19-the-pirates-of-the-ancient-mediterranean/</li>
                    </ul>
                    <p><strong>Lưu ý:</strong> Hệ thống sẽ tự động chuyển đổi dữ liệu sang định dạng phù hợp và hỗ trợ cả cấu trúc JSON cũ và mới.</p>
                  </div>
                </div>

                {/* Nút đóng */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowImportForm(false);
                      setImportPreview(null);
                      setImportFile(null);
                      setImportUrl('');
                    }}
                    className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-6 py-3 rounded-lg"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IeltsReadingAdminPage; 