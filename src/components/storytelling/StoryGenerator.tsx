import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Term {
  id: number;
  vocab: string;
  meaning: string;
  part_of_speech: string;
  level: number;
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

interface Props {
  onStoryGenerated: (story: Omit<Story, 'originalContent'>) => void;
}

// Màu sắc cho từng loại từ
const partOfSpeechColors: Record<string, string> = {
  'noun': 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
  'verb': 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100',
  'adjective': 'bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100',
  'adverb': 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100',
  'preposition': 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100',
  'conjunction': 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100',
  'pronoun': 'bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100',
  'default': 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
};

const LEVELS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Mới (0)', value: 0 },
  { label: 'Cấp 1', value: 1 },
  { label: 'Cấp 2', value: 2 },
  { label: 'Cấp 3', value: 3 },
  { label: 'Cấp 4', value: 4 },
  { label: 'Cấp 5', value: 5 },
  { label: 'Cấp 6', value: 6 },
  { label: 'Cấp 7', value: 7 },
  { label: 'Cấp 8', value: 8 },
  { label: 'Cấp 9', value: 9 },
  { label: 'Cấp 10', value: 10 },
];

export default function StoryGenerator({ onStoryGenerated }: Props) {
  const { user } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<number[]>([]);
  const [termCount, setTermCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRandomMode, setIsRandomMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'vocab' | 'part_of_speech' | 'time_added'>('vocab');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedLevel, setSelectedLevel] = useState<'all' | number>('all');

  // Lấy danh sách từ vựng của người dùng
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch(`/api/terms?userId=${user?.uid}`);
        if (!response.ok) throw new Error('Không thể lấy danh sách từ vựng');
        const data = await response.json();
        setTerms(data.terms);
      } catch (err) {
        setError('Lỗi khi tải danh sách từ vựng');
      }
    };

    if (user) {
      fetchTerms();
    }
  }, [user]);

  const handleGenerateStory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/storytelling/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
          termCount: isRandomMode ? termCount : undefined,
          selectedTerms: !isRandomMode && selectedTerms.length > 0 ? selectedTerms : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể tạo câu chuyện');
      }

      const data = await response.json();
      onStoryGenerated(data.story);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo câu chuyện');
    } finally {
      setLoading(false);
    }
  };

  const toggleTermSelection = (termId: number) => {
    if (isRandomMode) return;
    setSelectedTerms(prev => {
      if (prev.includes(termId)) {
        return prev.filter(id => id !== termId);
      }
      return [...prev, termId];
    });
  };

  // Lọc và sắp xếp từ vựng theo search, sort, level
  const filteredAndSortedTerms = terms
    .filter(term =>
      (term.vocab || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (term.meaning || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (term.part_of_speech || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(term => selectedLevel === 'all' ? true : term.level === selectedLevel)
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'vocab':
          return (a.vocab || '').localeCompare(b.vocab || '') * order;
        case 'part_of_speech':
          return (a.part_of_speech || '').localeCompare(b.part_of_speech || '') * order;
        case 'time_added':
          return (a.id - b.id) * order;
        default:
          return 0;
      }
    });

  // Khi đổi level thì reset chọn từ
  useEffect(() => {
    setSelectedTerms([]);
  }, [selectedLevel]);

  // Khi tick chọn từ thì cập nhật lại số lượng từ chọn
  useEffect(() => {
    if (!isRandomMode) {
      setTermCount(selectedTerms.length > 0 ? selectedTerms.length : filteredAndSortedTerms.length);
    }
  }, [selectedTerms, filteredAndSortedTerms.length, isRandomMode]);

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gray-900 rounded-2xl shadow-xl border border-gray-700">
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary-200 mb-3">Tạo câu chuyện chêm</h2>
          <p className="text-primary-200/80 text-lg">Chọn cách tạo câu chuyện phù hợp với bạn</p>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex items-center justify-center bg-gray-800/80 p-1 rounded-full w-fit mx-auto shadow-inner">
          <button
            onClick={() => setIsRandomMode(true)}
            className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ${
              isRandomMode 
                ? 'bg-primary-200 text-gray-900 shadow-sm scale-[0.98]' 
                : 'text-primary-200 hover:bg-primary-200/10'
            }`}
            style={{
              transformOrigin: 'center',
            }}
          >
            Chọn ngẫu nhiên
          </button>
          <button
            onClick={() => setIsRandomMode(false)}
            className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ${
              !isRandomMode 
                ? 'bg-primary-200 text-gray-900 shadow-sm scale-[0.98]' 
                : 'text-primary-200 hover:bg-primary-200/10'
            }`}
            style={{
              transformOrigin: 'center',
            }}
          >
            Chọn từ cụ thể
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isRandomMode ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800 p-6 rounded-lg"
            >
              <div className="max-w-xs mx-auto">
                <label className="block text-sm font-medium text-primary-200 mb-2">
                  Số lượng từ ngẫu nhiên
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={termCount}
                    onChange={(e) => setTermCount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-secondary-200 focus:border-transparent bg-gray-900 text-primary-200"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-primary-200">từ</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Thanh tìm kiếm */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm từ vựng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-primary-200 rounded-lg focus:ring-2 focus:ring-secondary-200 focus:border-transparent bg-gray-900 text-primary-200"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Sắp xếp */}
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-secondary-200 focus:border-transparent bg-gray-900 text-primary-200"
                >
                  <option value="vocab">Sắp xếp theo từ</option>
                  <option value="part_of_speech">Sắp xếp theo loại từ</option>
                  <option value="time_added">Sắp xếp theo thời gian thêm</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="w-12 h-12 flex items-center justify-center border border-primary-200 rounded-full hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-secondary-200 focus:border-transparent transition-all duration-200"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {/* Danh sách từ vựng */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-primary-200 mb-2 font-medium">Chọn cấp độ từ vựng</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-gray-900 text-primary-200 border-2 border-primary-200 focus:outline-none focus:border-secondary-200 text-lg font-bold"
                    value={selectedLevel}
                    onChange={e => setSelectedLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  >
                    {LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-primary-200 mb-2 font-medium">Số lượng từ đã chọn</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedTerms.length > 0 ? selectedTerms.length : filteredAndSortedTerms.length}
                    value={termCount}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl bg-gray-900 text-primary-200 border-2 border-primary-200 focus:outline-none focus:border-secondary-200 text-lg font-bold"
                  />
                </div>
              </div>

              <div className="mb-6 max-h-64 overflow-y-auto border border-gray-700 rounded-xl bg-gray-900">
                <table className="min-w-full text-sm text-primary-200">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="p-2 text-left font-semibold"><input type="checkbox" checked={selectedTerms.length === filteredAndSortedTerms.length && filteredAndSortedTerms.length > 0} onChange={e => setSelectedTerms(e.target.checked ? filteredAndSortedTerms.map(t => t.id) : [])} /></th>
                      <th className="p-2 text-left font-semibold">Từ vựng</th>
                      <th className="p-2 text-left font-semibold">Nghĩa</th>
                      <th className="p-2 text-left font-semibold">Loại từ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedTerms.length === 0 ? (
                      <tr><td colSpan={4} className="text-center text-primary-200/60 py-4">Không có từ vựng nào phù hợp.</td></tr>
                    ) : filteredAndSortedTerms.map(term => {
                      const isSelected = selectedTerms.includes(term.id);
                      return (
                        <tr
                          key={term.id}
                          className={isSelected ? 'bg-primary-200/10 cursor-pointer' : 'cursor-pointer hover:bg-primary-200/5'}
                          onClick={e => {
                            if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
                            if (isSelected) setSelectedTerms(ids => ids.filter(id => id !== term.id));
                            else setSelectedTerms(ids => [...ids, term.id]);
                          }}
                        >
                          <td className="p-2" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) setSelectedTerms(ids => [...ids, term.id]);
                                else setSelectedTerms(ids => ids.filter(id => id !== term.id));
                              }}
                            />
                          </td>
                          <td className="p-2 font-bold">{term.vocab}</td>
                          <td className="p-2">{term.meaning || <span className="italic text-primary-200/60">(Chưa có nghĩa)</span>}</td>
                          <td className="p-2">{term.part_of_speech}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 text-red-700 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        <div className="flex justify-center">
          <motion.button
            onClick={handleGenerateStory}
            disabled={loading || (isRandomMode && termCount < 1) || (!isRandomMode && selectedTerms.length === 0)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-3 rounded-lg text-white font-medium transition-colors ${
              loading || (isRandomMode && termCount < 1) || (!isRandomMode && selectedTerms.length === 0)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tạo...
              </span>
            ) : (
              'Tạo câu chuyện'
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
} 