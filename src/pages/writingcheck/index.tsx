import React, { useState } from 'react';
import { useRouter } from 'next/router';

const levels = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'Phù hợp cho người mới bắt đầu học tiếng Anh. Câu đơn giản và từ vựng cơ bản.',
    time: '15–20 phút mỗi bài',
    icon: (
      <span className="inline-flex items-center justify-center rounded-full bg-green-600 w-8 h-8 mr-2">
        <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#22c55e" /><path d="M10 5v10M5 10h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
      </span>
    ),
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Dành cho người học đã có nền tảng, luyện tập câu phức và từ vựng đa dạng.',
    time: '20–30 phút mỗi bài',
    icon: (
      <span className="inline-flex items-center justify-center rounded-full bg-blue-600 w-8 h-8 mr-2">
        <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#2563eb" /><path d="M10 5l2 6h-4l2-6z" fill="#fff" /></svg>
      </span>
    ),
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Thử thách bản thân với bài viết chuyên sâu, từ vựng học thuật.',
    time: '30–40 phút mỗi bài',
    icon: (
      <span className="inline-flex items-center justify-center rounded-full bg-purple-600 w-8 h-8 mr-2">
        <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#a21caf" /><path d="M10 5l3 9H7l3-9z" fill="#fff" /></svg>
      </span>
    ),
  },
];

const contentTypes = [
  {
    id: 'emails',
    title: 'Emails',
    description: 'Thư tín công việc và cá nhân',
    icon: <span className="text-yellow-400 text-3xl">✉️</span>,
  },
  {
    id: 'diaries',
    title: 'Diaries',
    description: 'Nhật ký, cảm xúc cá nhân',
    icon: <span className="text-yellow-400 text-3xl">📒</span>,
  },
  {
    id: 'essays',
    title: 'Essays',
    description: 'Bài luận học thuật, ý kiến',
    icon: <span className="text-yellow-400 text-3xl">🖋️</span>,
  },
  {
    id: 'articles',
    title: 'Articles',
    description: 'Bài báo, tạp chí',
    icon: <span className="text-yellow-400 text-3xl">📰</span>,
  },
  {
    id: 'stories',
    title: 'Stories',
    description: 'Truyện ngắn, truyện kể',
    icon: <span className="text-yellow-400 text-3xl">📖</span>,
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Báo cáo công việc, nghiên cứu',
    icon: <span className="text-yellow-400 text-3xl">📈</span>,
  },
];

const WritingCheckPage = () => {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleStart = () => {
    if (selectedLevel && selectedType) {
      router.push(`/writingcheck/list?level=${selectedLevel}&type=${selectedType}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#181b22] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-yellow-400 mb-10 tracking-wider drop-shadow-lg">WRITING</h1>
        <div className="mb-8">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Chọn cấp độ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {levels.map((level) => (
              <div
                key={level.id}
                className={`rounded-xl p-6 bg-[#232733] border-2 transition-all cursor-pointer ${selectedLevel === level.id ? 'border-yellow-400 shadow-lg scale-105' : 'border-transparent'} hover:border-yellow-400`}
                onClick={() => setSelectedLevel(level.id)}
              >
                <div className="flex items-center mb-2">{level.icon}<span className="font-bold text-white text-lg">{level.title}</span></div>
                <div className="text-gray-300 text-sm mb-2">{level.description}</div>
                <div className="text-gray-400 text-xs flex items-center"><span className="mr-1">⏱️</span>{level.time}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Chọn loại nội dung</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contentTypes.map((type) => (
              <div
                key={type.id}
                className={`rounded-xl p-6 bg-[#232733] border-2 transition-all cursor-pointer flex flex-col items-center ${selectedType === type.id ? 'border-yellow-400 shadow-lg scale-105' : 'border-transparent'} hover:border-yellow-400`}
                onClick={() => setSelectedType(type.id)}
              >
                <div className="mb-2">{type.icon}</div>
                <div className="font-bold text-white text-lg mb-1">{type.title}</div>
                <div className="text-gray-300 text-sm text-center">{type.description}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all disabled:opacity-50"
            disabled={!selectedLevel || !selectedType}
            onClick={handleStart}
          >
            Start Practice →
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritingCheckPage; 