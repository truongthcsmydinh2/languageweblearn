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

const IeltsReadingAdminTestPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    fetchPassages();
  }, [user, router]);

  const fetchPassages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ielts-reading/passages');
      if (response.ok) {
        const data = await response.json();
        setPassages(data.passages);
      }
    } catch (error) {
      console.error('Error fetching passages:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-50">IELTS Reading Admin Test</h1>
          <div className="text-gray-300">
            User: {user?.email} | UID: {user?.uid}
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-50 mb-4">Danh sách bài đọc</h2>
          <div className="space-y-4">
            {passages.map((passage) => (
              <div key={passage.id} className="bg-gray-600 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-200 mb-2">{passage.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
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
            ))}
          </div>
        </div>

        <div className="mt-8 bg-gray-700 rounded-lg p-6">
          {/* Đã xóa phần Test Links theo yêu cầu */}
        </div>
      </div>
    </div>
  );
};

export default IeltsReadingAdminTestPage; 