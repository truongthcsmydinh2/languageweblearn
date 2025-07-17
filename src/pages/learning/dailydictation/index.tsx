import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Layout from '@/components/layout';
import { MdVolumeUp, MdPlayArrow, MdInfo } from 'react-icons/md';

interface Lesson {
  id: string;
  title: string;
  content: string;
  level: string;
  thumbnail?: string;
  base_audio_url?: string;
  sentence_count?: number;
  created_at: string;
  sentences?: any[];
}

const DailyDictationPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // Lấy danh sách bài học từ API
  useEffect(() => {
    const fetchLessons = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/learning/dictation');
        const data = await res.json();
        if (Array.isArray(data)) {
          setLessons(data.map((l: any) => ({ ...l, id: l.id || l.lessonId, created_at: l.createdAt || l.created_at })));
          setError(null);
        } else {
          setLessons([]);
          setError('Không lấy được danh sách bài dictation.');
        }
      } catch (e) {
        setLessons([]);
        setError('Không lấy được danh sách bài dictation.');
      }
      setIsLoading(false);
    };
    fetchLessons();
  }, []);

  // Lọc bài học theo cấp độ đã chọn
  const filteredLessons = selectedLevel 
    ? lessons.filter(lesson => lesson.level === selectedLevel)
    : lessons;

  // Lấy danh sách các cấp độ có sẵn
  const availableLevels = Array.from(new Set(lessons.map(lesson => lesson.level))).sort();

  // Chuyển hướng đến trang bài học cụ thể
  const navigateToLesson = (lessonId: string) => {
    if (lessonId) {
      router.push(`/learning/dailydictation/${lessonId}`);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Luyện nghe và gõ tiếng Anh</h1>
        {/* Filters */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Chọn cấp độ</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLevel(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedLevel === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            {availableLevels.map(level => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedLevel === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Đang tải danh sách bài dictation...</div>
        ) : error ? (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
            <div className="flex items-start">
              <MdInfo className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Lỗi</h3>
                <p className="text-blue-700 mb-4">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {selectedLevel
                ? `Không tìm thấy bài học nào ở cấp độ ${selectedLevel}`
                : 'Chưa có bài học nào. Vui lòng quay lại sau.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map(lesson => (
              <div 
                key={lesson.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="h-48 bg-gray-200 relative">
                  {lesson.thumbnail ? (
                    <img
                      src={lesson.thumbnail}
                      alt={lesson.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
                      <MdVolumeUp size={48} className="text-blue-800" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{lesson.title}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {lesson.level}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-gray-500 text-xs">
                      {lesson.sentence_count || (lesson.sentences ? lesson.sentences.length : 0)} câu
                    </span>
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition"
                      onClick={() => navigateToLesson(lesson.id)}
                    >
                      Bắt đầu học
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default DailyDictationPage; 