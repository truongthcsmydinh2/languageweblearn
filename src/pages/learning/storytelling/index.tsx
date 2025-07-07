import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import StoryGenerator from '@/components/storytelling/StoryGenerator';
import StoryWithMultipleChoice from '@/components/storytelling/StoryWithMultipleChoice';
import StoryWithInput from '@/components/storytelling/StoryWithInput';

interface Term {
  id: number;
  vocab: string;
  meaning: string;
  part_of_speech: string;
}

interface StoryTerm {
  id: string;
  vocabId: number;
  context: string;
  contextual_meaning?: string;
}

interface Story {
  id: string;
  content: string;
  originalContent: string;
  terms: StoryTerm[];
}

type LearningStep = 'generate' | 'multiple-choice' | 'input' | 'complete';

export default function StorytellingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [step, setStep] = useState<LearningStep>('generate');
  const [terms, setTerms] = useState<Term[]>([]);

  const handleStoryGenerated = (newStory: Omit<Story, 'originalContent'>) => {
    setStory({
      ...newStory,
      originalContent: newStory.content
    });
    
    // Tìm các từ tiếng Anh trong câu chuyện
    const findEnglishWords = () => {
      const content = newStory.content;
      // Tìm tất cả các từ tiếng Anh trong câu chuyện
      const englishWords = new Set<string>();
      const regex = /\b([a-zA-Z]{4,})\b/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        // Chỉ lấy các từ tiếng Anh, không phải từ tiếng Việt
        if (!/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(match[1])) {
          englishWords.add(match[1].toLowerCase());
        }
      }
      
      console.log("Detected English words:", Array.from(englishWords));
      
      // Tạo terms dựa trên các từ tiếng Anh tìm được
      const extractedTerms: Term[] = Array.from(englishWords).map((word, index) => ({
        id: index,
        vocab: word,
        meaning: `Nghĩa của từ ${word}`, // Nghĩa mặc định
        part_of_speech: 'unknown'
      }));
      
      return extractedTerms;
    };
    
    // Cố gắng lấy dữ liệu từ API
    const fetchTermDetails = async () => {
      try {
        const ids = newStory.terms.map(term => term.vocabId);
        console.log("Term IDs to fetch:", ids);
        
        // Nếu không có IDs, sử dụng phương pháp phát hiện từ tiếng Anh
        if (!ids.length) {
          console.log("No term IDs found, using English word detection");
          const extractedTerms = findEnglishWords();
          setTerms(extractedTerms);
          return;
        }
        
        const response = await fetch(`/api/terms?ids=${ids.join(',')}`);
        if (!response.ok) {
          throw new Error('Không thể lấy thông tin từ vựng');
        }
        
        const data = await response.json();
        console.log("Fetched terms:", data.terms);
        
        if (data.terms && data.terms.length > 0) {
          setTerms(data.terms);
        } else {
          // Fallback nếu API không trả về dữ liệu
          throw new Error('API trả về danh sách từ vựng rỗng');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin từ vựng:', error);
        
        // Thử phát hiện từ tiếng Anh trong câu chuyện
        const extractedTerms = findEnglishWords();
        
        if (extractedTerms.length > 0) {
          setTerms(extractedTerms);
        } else {
          // Fallback cuối cùng - trích xuất từ context
          const convertedTerms = newStory.terms.map(term => ({
            id: Number(term.vocabId),
            vocab: term.context.match(/\b[a-zA-Z]{4,}\b/g)?.[0] || 'unknown',
            meaning: term.contextual_meaning || 'Không có nghĩa',
            part_of_speech: ''
          }));
          setTerms(convertedTerms);
        }
      }
    };

    fetchTermDetails();
    setStep('multiple-choice');
  };

  const handleStepComplete = () => {
    switch (step) {
      case 'multiple-choice':
        setStep('input');
        break;
      case 'input':
        setStep('complete');
        break;
      case 'complete':
        setStory(null);
        setStep('generate');
        break;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Vui lòng đăng nhập để sử dụng tính năng này
            </h1>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {step === 'generate' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Tạo câu chuyện chêm từ vựng
              </h1>
              <p className="text-lg text-gray-600">
                Chọn cách học phù hợp với bạn
              </p>
            </div>
            <StoryGenerator onStoryGenerated={handleStoryGenerated} />
          </>
        )}

        {step === 'multiple-choice' && story && (
          <StoryWithMultipleChoice 
            story={story} 
            terms={terms}
            onComplete={handleStepComplete}
          />
        )}

        {step === 'input' && story && (
          <StoryWithInput 
            story={story} 
            terms={terms}
            onComplete={handleStepComplete}
          />
        )}

        {step === 'complete' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Chúc mừng! Bạn đã hoàn thành bài học
            </h2>
            <button
              onClick={handleStepComplete}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tạo câu chuyện mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 