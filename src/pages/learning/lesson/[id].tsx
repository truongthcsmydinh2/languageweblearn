import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout';
import Link from 'next/link';
import { MdArrowBack, MdPlayArrow, MdPause, MdVolumeUp, MdInfo } from 'react-icons/md';

interface Lesson {
  id: string;
  title: string;
  fileName: string;
  content: string;
  audioFile?: string;
  thumbnail?: string;
  createdAt: string;
  level: string;
}

export default function LessonDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Tạm thời bỏ phần tải thông tin bài học
  useEffect(() => {
    if (!id) return;
    
    // Tạm thời không gọi API lessons vì bảng chưa tồn tại
    setError('Tính năng bài học đang được bảo trì. Vui lòng quay lại sau.');
    setIsLoading(false);
  }, [id]);
  
  // Tải và thiết lập audio
  const loadAudio = async (audioFile: string) => {
    try {
      const response = await fetch(`/api/learning/dictation/audio?file=${encodeURIComponent(audioFile)}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải file audio');
      }
      
      // Kiểm tra Content-Type của response
      const contentType = response.headers.get('Content-Type');
      
      if (contentType && contentType.includes('audio')) {
        // Nếu response là file audio trực tiếp
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.addEventListener('ended', () => {
            setIsPlaying(false);
          });
        }
      } else {
        // Nếu response là JSON (URL tới file audio)
        const data = await response.json();
        
        if (audioRef.current) {
          audioRef.current.src = data.url;
          audioRef.current.addEventListener('ended', () => {
            setIsPlaying(false);
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải audio:', error);
    }
  };
  
  // Phát/dừng audio
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  if (error || !lesson) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
            <div className="flex items-start">
              <MdInfo className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Tính năng đang bảo trì</h3>
                <p className="text-blue-700 mb-4">{error || 'Không tìm thấy bài học'}</p>
                <div className="bg-blue-100 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Các tính năng khác bạn có thể sử dụng:</h4>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Học từ vựng trong Dashboard</li>
                    <li>• Tạo bộ từ vựng riêng</li>
                    <li>• Luyện tập với các bài kiểm tra</li>
                    <li>• Xem thống kê học tập</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <Link 
            href="/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <MdArrowBack className="mr-1" /> Quay lại Dashboard
          </Link>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <MdArrowBack className="mr-1" /> Quay lại Dashboard
        </Link>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{lesson.title}</h1>
              <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-medium">
                {lesson.level}
              </span>
            </div>
            
            {lesson.audioFile && (
              <div className="mb-8 bg-gray-50 rounded-lg p-4">
                <audio ref={audioRef} className="hidden" />
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    {isPlaying ? <MdPause size={24} /> : <MdPlayArrow size={24} />}
                  </button>
                  <div>
                    <p className="text-gray-700 font-medium">Nghe bài đọc</p>
                    <p className="text-sm text-gray-500">Luyện nghe phát âm tiếng Anh chuẩn</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="prose prose-lg max-w-none">
              {lesson.content.split('\n').map((paragraph, index) => (
                paragraph.trim() ? (
                  <p key={index} className="mb-4">{paragraph}</p>
                ) : null
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Độ khó: <span className="font-medium">{lesson.level}</span>
              </p>
              
              <Link
                href={`/learning/dailydictation?lesson=${lesson.id}`}
                className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MdVolumeUp size={18} />
                Luyện nghe và gõ
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Mẹo học tập</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="inline-block h-4 w-4 rounded-full bg-blue-600 mt-1 mr-2"></span>
              <span>Đọc to bài văn để luyện phát âm và ngữ điệu</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block h-4 w-4 rounded-full bg-blue-600 mt-1 mr-2"></span>
              <span>Ghi chú lại các từ mới và cách diễn đạt hay</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block h-4 w-4 rounded-full bg-blue-600 mt-1 mr-2"></span>
              <span>Thử nghe và gõ lại nội dung bài học để cải thiện kỹ năng nghe</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block h-4 w-4 rounded-full bg-blue-600 mt-1 mr-2"></span>
              <span>Luyện tập thường xuyên, mỗi ngày chỉ cần 15-20 phút</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
} 