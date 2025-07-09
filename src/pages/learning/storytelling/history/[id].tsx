import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

interface Story {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface StoryTerm {
  id: string;
  vocabId: number;
  context: string;
  contextual_meaning: string;
  created_at?: string;
}

const StoryDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [story, setStory] = useState<Story | null>(null);
  const [terms, setTerms] = useState<StoryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/storytelling/story?id=${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Không tìm thấy chuyện chêm');
        const data = await res.json();
        setStory(data.story);
        setTerms(data.terms || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Đang tải...</div>;
  if (error) return <div className="min-h-screen bg-gray-900 text-red-400 flex items-center justify-center">{error}</div>;
  if (!story) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Không tìm thấy chuyện chêm</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-2 text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Chuyện chêm #{story.id}</h1>
        <div className="text-sm text-gray-400 mb-4">Tạo lúc: {new Date(story.created_at).toLocaleString()}</div>
        <div className="prose prose-invert max-w-none text-lg leading-relaxed mb-6 whitespace-pre-line">
          {story.content}
        </div>
        <h2 className="text-xl font-semibold mb-2 mt-6">Từ vựng đã chêm</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-900 rounded-lg">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-gray-400">Từ vựng</th>
                <th className="px-3 py-2 text-left text-gray-400">Nghĩa ngữ cảnh</th>
                <th className="px-3 py-2 text-left text-gray-400">Context</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((term) => (
                <tr key={term.id} className="hover:bg-gray-800">
                  <td className="px-3 py-2 font-semibold text-blue-300">{term.context}</td>
                  <td className="px-3 py-2 text-green-300">{term.contextual_meaning}</td>
                  <td className="px-3 py-2 text-gray-300 max-w-xs truncate">{term.context}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          className="mt-8 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow hover:from-blue-600 hover:to-purple-600 transition"
          onClick={() => router.push('/learning/storytelling/history')}
        >
          ← Quay lại lịch sử
        </button>
        <button
          className="mt-4 ml-4 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg shadow hover:from-green-600 hover:to-blue-600 transition"
          onClick={() => {
            router.push({
              pathname: '/learning/storytelling',
              query: { reLearn: '1', storyId: story.id }
            }, '/learning/storytelling');
          }}
        >
          Học lại chuyện chêm này
        </button>
      </div>
    </div>
  );
};

export default StoryDetailPage; 