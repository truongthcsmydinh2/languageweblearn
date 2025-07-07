import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import useRequireAuth from '@/hooks/useRequireAuth';

interface Lesson {
  id: number;
  title: string;
  content: string;
  level: string;
  type: string;
  created_at?: string;
}

interface UserProgress {
  id: number;
  firebase_uid: string;
  lesson_id: number;
  current_sentence: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
  lesson: {
    id: number;
    title: string;
    sentences: { id: number; sentence_order: number }[];
  };
}

const LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};
const TYPES = {
  EMAILS: 'Emails',
  DIARIES: 'Diaries',
  ESSAYS: 'Essays',
  ARTICLES: 'Articles',
  STORIES: 'Stories',
  REPORTS: 'Reports',
};
const PAGE_SIZE = 6;

const WritingLessonList = () => {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLessons, setTotalLessons] = useState(0);
  const [level, setLevel] = useState('All');
  const [type, setType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('All');
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const { user } = useAuth();
  
  useRequireAuth();

  // Đọc URL parameters khi component mount
  useEffect(() => {
    const { level: urlLevel, type: urlType } = router.query;
    if (urlLevel && typeof urlLevel === 'string') {
      setLevel(urlLevel.toUpperCase());
    }
    if (urlType && typeof urlType === 'string') {
      const upperType = urlType.toUpperCase();
      setType(upperType);
      setFilterType(upperType);
    }
  }, [router.query]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/writinglesson';
      const params = new URLSearchParams();
      
      if (level !== 'All') params.append('level', level);
      if (type !== 'All') params.append('type', type);
      if (searchTerm) params.append('search', searchTerm);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🔍 Fetching lessons with URL:', url);
      
      const res = await fetch(url);
      const data = await res.json();
      setLessons(data);
      setTotalLessons(data.length);
      console.log('📊 Fetched lessons:', data.length, 'lessons');
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setLessons([]);
      setTotalLessons(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [level, type, searchTerm]);

  // Cập nhật URL khi filter thay đổi
  useEffect(() => {
    const query: any = {};
    if (level !== 'All') query.level = level.toLowerCase();
    if (type !== 'All') query.type = type.toLowerCase();
    
    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  }, [level, type, router]);

  // Hàm lấy tiến độ học tập của người dùng
  const fetchUserProgress = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/writingcheck/progress?firebase_uid=${user.uid}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setUserProgress(data);
    } catch (error) {
      console.error('Lỗi khi lấy tiến độ học tập:', error);
    }
  };
  
  // Hàm lấy tiến độ học tập của một bài học cụ thể
  const getLessonProgress = (lessonId: number) => {
    const progress = userProgress.find(p => p.lesson_id === lessonId);
    if (!progress) return null;
    
    // Tính phần trăm hoàn thành
    const totalSentences = progress.lesson.sentences.length;
    if (totalSentences === 0) return null;
    
    const percentComplete = progress.completed 
      ? 100 
      : Math.round((progress.current_sentence / totalSentences) * 100);
    
    return {
      currentSentence: progress.current_sentence,
      totalSentences,
      percentComplete,
      completed: progress.completed
    };
  };

  // Lọc theo loại bài nếu chọn filter (chỉ áp dụng khi không có filter từ URL)
  const filteredLessons = filterType === 'All' ? lessons : lessons.filter(l => l.type === filterType);
  
  // Sắp xếp bài học: ưu tiên bài đang làm dở dang
  const sortedLessons = filteredLessons.sort((a, b) => {
    const progressA = getLessonProgress(a.id);
    const progressB = getLessonProgress(b.id);
    
    // Bài đang làm dở dang (có progress nhưng chưa hoàn thành)
    const isInProgressA = progressA && !progressA.completed && progressA.currentSentence > 0;
    const isInProgressB = progressB && !progressB.completed && progressB.currentSentence > 0;
    
    // Bài chưa làm
    const isNotStartedA = !progressA;
    const isNotStartedB = !progressB;
    
    // Bài đã hoàn thành
    const isCompletedA = progressA && progressA.completed;
    const isCompletedB = progressB && progressB.completed;
    
    // Thứ tự ưu tiên: Đang làm > Chưa làm > Đã hoàn thành
    if (isInProgressA && !isInProgressB) return -1;
    if (!isInProgressA && isInProgressB) return 1;
    if (isNotStartedA && !isNotStartedB) return -1;
    if (!isNotStartedA && isNotStartedB) return 1;
    if (isCompletedA && !isCompletedB) return 1;
    if (!isCompletedA && isCompletedB) return -1;
    
    // Nếu cùng trạng thái, sắp xếp theo thời gian tạo mới nhất
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
  
  const total = sortedLessons.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paginatedLessons = sortedLessons.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getShortContent = (content: string) => {
    if (!content) return '';
    return content.length > 90 ? content.slice(0, 90) + ' ...' : content;
  };

  const getTypeLabel = (type: string) => TYPES[type as keyof typeof TYPES] || type;

  // Lấy tiến độ học tập khi user thay đổi
  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#181b22] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold text-yellow-400 mb-4 sm:mb-0">Available Exercises</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => router.push('/writingcheck/history')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              📊 History
            </button>
            <button
              onClick={() => router.push('/writingcheck/test')}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm"
            >
              🧪 Test Gemini
            </button>
            
            {/* Filter Controls */}
            <div className="flex gap-2 items-center">
              <label className="text-gray-300 font-semibold text-sm">Level:</label>
              <select
                className="bg-[#232733] text-white rounded px-3 py-1 border border-gray-600 text-sm"
                value={level}
                onChange={e => { setLevel(e.target.value); setPage(1); }}
              >
                <option value="All">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            
            <div className="flex gap-2 items-center">
              <label className="text-gray-300 font-semibold text-sm">Type:</label>
              <select
                className="bg-[#232733] text-white rounded px-3 py-1 border border-gray-600 text-sm"
                value={type}
                onChange={e => { setType(e.target.value); setFilterType(e.target.value); setPage(1); }}
              >
                <option value="All">All Types</option>
                {Object.entries(TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-white">Loading...</div>
        ) : total === 0 ? (
          <div className="text-center text-gray-400">No exercises found.</div>
        ) : (
          <>
            {/* Filter Info - Đã ẩn để giao diện gọn gàng */}
            {/* {(level !== 'All' || type !== 'All') && (
              <div className="mb-4 p-3 bg-[#232733] rounded-lg">
                <div className="text-gray-300 text-sm">
                  <span className="font-semibold">Current Filter:</span>
                  {level !== 'All' && <span className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs">{LEVELS[level as keyof typeof LEVELS]}</span>}
                  {type !== 'All' && <span className="ml-2 px-2 py-1 bg-green-500 text-white rounded text-xs">{TYPES[type as keyof typeof TYPES]}</span>}
                  <span className="ml-2 text-gray-400">({total} exercises)</span>
                  <button 
                    onClick={() => { setLevel('All'); setType('All'); setFilterType('All'); }}
                    className="ml-4 text-yellow-400 hover:text-yellow-300 underline text-xs"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            )} */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {paginatedLessons.map((lesson) => {
                const progress = getLessonProgress(lesson.id);
                
                // Xác định trạng thái bài học
                let statusBadge = null;
                let statusColor = 'bg-cyan-500';
                
                if (progress) {
                  if (progress.completed) {
                    statusBadge = '✅ Completed';
                    statusColor = 'bg-green-500';
                  } else if (progress.currentSentence > 0) {
                    statusBadge = '🔄 In Progress';
                    statusColor = 'bg-yellow-500';
                  }
                } else {
                  statusBadge = '🆕 New';
                  statusColor = 'bg-cyan-500';
                }
                
                return (
                  <div key={lesson.id} className="bg-[#232733] rounded-2xl shadow-lg p-6 flex flex-col justify-between min-h-[180px] relative">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="font-bold text-lg text-white mr-2 truncate">{lesson.title}</span>
                        <span className={`ml-auto text-xs px-3 py-1 rounded-full ${statusColor} text-white font-bold`}>
                          {statusBadge}
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm mb-2 truncate">{getShortContent(lesson.content)}</div>
                      <div className="flex items-center text-xs text-gray-400 gap-4 mb-2">
                        <span>{lesson.created_at ? timeAgo(lesson.created_at) : 'Never'}</span>
                        <span>|</span>
                        <span>{getTypeLabel(lesson.type)}</span>
                      </div>
                      
                      {/* Hiển thị tiến độ nếu có */}
                      {progress && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-300 mb-1">
                            <span>{progress.completed ? 'Completed' : `${progress.currentSentence}/${progress.totalSentences} câu`}</span>
                            <span>{progress.percentComplete}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${progress.completed ? 'bg-green-500' : 'bg-yellow-400'} transition-all`} 
                              style={{ width: `${progress.percentComplete}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-[#181b22] font-bold py-2 px-6 rounded-lg text-base shadow-lg self-end"
                      onClick={() => router.push(`/writingcheck/practice/${lesson.id}`)}
                    >
                      {progress?.completed ? 'Review Exercise' : progress ? 'Continue' : 'Start Exercise'}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-gray-300 text-sm">
              <span>Displaying items {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, total)} of {total} in total</span>
              <div className="flex gap-2 items-center">
                <button
                  className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >&lt;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                  <button
                    key={p}
                    className={`px-3 py-1 rounded ${p === page ? 'bg-yellow-400 text-[#181b22] font-bold' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                    onClick={() => setPage(p)}
                  >{p}</button>
                ))}
                <button
                  className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >&gt;</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default WritingLessonList; 