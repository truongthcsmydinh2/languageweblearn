import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import StoryHistory from '@/components/storytelling/StoryHistory';

export default function StoryHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSelect = (storyId: number) => {
    // Chuyển sang trang chi tiết story (có thể tạo sau)
    router.push(`/learning/storytelling/history/${storyId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-200 mb-4">Vui lòng đăng nhập để xem lịch sử chuyện chêm</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-200 mb-8 text-center">Lịch sử chuyện chêm</h1>
        <StoryHistory userId={user.uid} onSelect={handleSelect} />
      </div>
    </div>
  );
} 