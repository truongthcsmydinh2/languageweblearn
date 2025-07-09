import { useEffect, useState } from 'react';

interface StoryPreview {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  userId: string;
  onSelect: (storyId: number) => void;
}

export default function StoryHistory({ userId, onSelect }: Props) {
  const [stories, setStories] = useState<StoryPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/storytelling/history?userId=${userId}`);
        if (!res.ok) throw new Error('Không thể tải lịch sử chuyện chêm');
        const data = await res.json();
        setStories(data.stories || []);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải lịch sử');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchStories();
  }, [userId]);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 mb-8">
      <h3 className="text-xl font-bold text-primary-200 mb-4">Lịch sử chuyện chêm</h3>
      {loading && <div className="text-primary-200">Đang tải...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {(!loading && stories.length === 0) && <div className="text-primary-200/60">Chưa có chuyện chêm nào.</div>}
      <ul className="divide-y divide-gray-700">
        {stories.map(story => (
          <li key={story.id} className="py-3 cursor-pointer hover:bg-primary-200/5 rounded transition-all" onClick={() => onSelect(story.id)}>
            <div className="text-primary-200 font-semibold mb-1">#{story.id} - {new Date(story.created_at).toLocaleString('vi-VN')}</div>
            <div className="text-primary-200/80 text-sm line-clamp-2">{story.content.slice(0, 120)}...</div>
          </li>
        ))}
      </ul>
    </div>
  );
} 