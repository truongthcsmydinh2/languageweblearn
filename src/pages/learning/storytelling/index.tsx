import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import StoryGenerator from '@/components/storytelling/StoryGenerator';
import StoryWithMultipleChoice from '@/components/storytelling/StoryWithMultipleChoice';
import StoryWithInput from '@/components/storytelling/StoryWithInput';
import Link from 'next/link';

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

interface StoryTermAPI {
  id: string | number;
  vocab_id: number;
  context: string;
  contextual_meaning: string;
}

type LearningStep = 'generate' | 'multiple-choice' | 'input' | 'complete';

export default function StorytellingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [step, setStep] = useState<LearningStep>('generate');
  const [terms, setTerms] = useState<Term[]>([]);

  useEffect(() => {
    // Nếu là học lại story chêm
    if (router.query.reLearn === '1' && router.query.storyId) {
      const fetchOldStory = async () => {
        setStep('generate');
        setStory(null);
        setTerms([]);
        try {
          const res = await fetch(`/api/storytelling/story?id=${router.query.storyId}`);
          if (!res.ok) throw new Error('Không tìm thấy chuyện chêm');
          const data = await res.json();
          // Chuyển đổi dữ liệu về đúng định dạng
          const oldStory = {
            id: String(data.story.id),
            content: data.story.content,
            originalContent: data.story.content,
            terms: (data.terms || []).map((t: StoryTermAPI) => ({
              id: String(t.id),
              vocabId: t.vocab_id,
              context: t.context,
              contextual_meaning: t.contextual_meaning
            }))
          };
          setStory(oldStory);
          // Lấy chi tiết từ vựng nếu có vocabId
          const vocabIds = oldStory.terms.map(t => t.vocabId).filter(Boolean);
          if (vocabIds.length > 0) {
            const resp = await fetch(`/api/terms?ids=${vocabIds.join(',')}`);
            if (resp.ok) {
              const dataTerms = await resp.json();
              setTerms(dataTerms.terms || []);
            }
          }
          setStep('multiple-choice');
        } catch (err) {
          setStep('generate');
        }
      };
      fetchOldStory();
    }
  }, [router.query.reLearn, router.query.storyId]);

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
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
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

  // Nếu đang học lại story chêm thì ẩn nút tạo mới
  if (router.query.reLearn === '1' && router.query.storyId && step === 'generate') {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center text-white">
        Đang tải lại chuyện chêm...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {step === 'generate' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Tạo câu chuyện chêm từ vựng
                </h1>
                <p className="text-lg text-gray-600">
                  Chọn cách học phù hợp với bạn
                </p>
              </div>
              <Link href="/learning/storytelling/history" legacyBehavior>
                <a className="ml-4 p-2 rounded-full bg-gray-800 hover:bg-primary-200/20 transition-colors" title="Xem lịch sử chuyện chêm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary-200">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                </a>
              </Link>
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