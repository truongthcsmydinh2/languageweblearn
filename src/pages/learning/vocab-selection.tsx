import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Term {
  id: string;
  term: string;
  meanings: string[];
  part_of_speech: string;
  level: number;
  level_en: number;
  level_vi: number;
}

const VocabSelectionPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<Term[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | null>(0); // Đặt mặc định là level 0
  const [wordCount, setWordCount] = useState(10);
  const [error, setError] = useState('');
  const [groupedTerms, setGroupedTerms] = useState<{[key: number]: Term[]}>({});

  useEffect(() => {
    // Kiểm tra đăng nhập
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Lấy danh sách từ vựng
    fetchVocabulary();
  }, [user, router]);

  useEffect(() => {
    // Lọc từ vựng dựa trên từ khóa tìm kiếm và cấp độ
    filterTerms();
  }, [terms, searchQuery, levelFilter]);
  
  useEffect(() => {
    // Nhóm từ vựng theo cấp độ
    groupTermsByLevel();
  }, [filteredTerms]);

  const fetchVocabulary = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Thêm limit=1000 để lấy tất cả từ vựng mà không giới hạn
      const response = await fetch('/api/vocab?limit=1000', {
        headers: {
          'firebase_uid': user?.uid || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Ánh xạ dữ liệu từ API vào interface Term
        const mappedTerms = (data.data || []).map((item: any) => ({
          id: item.id,
          term: item.vocab,
          meanings: item.meanings || [],
          part_of_speech: item.part_of_speech || '',
          level: item.level_en || 0, // Sử dụng level_en làm level mặc định
          level_en: item.level_en || 0,
          level_vi: item.level_vi || 0
        }));
        setTerms(mappedTerms);
      } else {
        const errorText = await response.text();
        console.error('Error fetching vocabulary:', errorText);
        setError('Không thể tải danh sách từ vựng. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      setError('Đã xảy ra lỗi khi tải danh sách từ vựng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const filterTerms = () => {
    let filtered = [...terms];
    
    // Lọc theo từ khóa tìm kiếm
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(term => 
        term.term.toLowerCase().includes(query) || 
        term.meanings.some(meaning => meaning.toLowerCase().includes(query))
      );
    }
    
    // Lọc theo cấp độ (sử dụng level_en)
    if (levelFilter !== null) {
      filtered = filtered.filter(term => term.level_en === levelFilter);
    }
    
    setFilteredTerms(filtered);
  };
  
  const groupTermsByLevel = () => {
    const grouped: {[key: number]: Term[]} = {};
    
    // Nhóm các từ vựng theo cấp độ (sử dụng level_en)
    filteredTerms.forEach(term => {
      if (!grouped[term.level_en]) {
        grouped[term.level_en] = [];
      }
      grouped[term.level_en].push(term);
    });
    
    setGroupedTerms(grouped);
  };

  const toggleTermSelection = (termId: string) => {
    setSelectedTerms(prev => {
      if (prev.includes(termId)) {
        return prev.filter(id => id !== termId);
      } else {
        return [...prev, termId];
      }
    });
  };
  
  const toggleLevelSelection = (level: number, isSelected: boolean) => {
    const termsInLevel = groupedTerms[level] || [];
    const termIds = termsInLevel.map(term => term.id);
    
    setSelectedTerms(prev => {
      if (isSelected) {
        // Thêm tất cả các từ trong cấp độ này (nếu chưa được chọn)
        const newSelection = [...prev];
        termIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      } else {
        // Loại bỏ tất cả các từ trong cấp độ này
        return prev.filter(id => !termIds.includes(id));
      }
    });
  };
  
  const isLevelSelected = (level: number): boolean => {
    const termsInLevel = groupedTerms[level] || [];
    if (termsInLevel.length === 0) return false;
    
    // Kiểm tra xem tất cả các từ trong cấp độ này đã được chọn chưa
    return termsInLevel.every(term => selectedTerms.includes(term.id));
  };

  const handleStartLearning = () => {
    if (selectedTerms.length === 0) {
      // Nếu không có từ nào được chọn, chọn ngẫu nhiên theo số lượng
      const randomTerms = getRandomTerms(filteredTerms, wordCount);
      const randomTermIds = randomTerms.map(term => term.id);
      
      router.push({
        pathname: '/learning/vocab-example',
        query: { words: randomTermIds.join(',') }
      });
    } else {
      // Nếu có từ được chọn, sử dụng danh sách đã chọn
      router.push({
        pathname: '/learning/vocab-example',
        query: { words: selectedTerms.join(',') }
      });
    }
  };

  // Hàm lấy ngẫu nhiên n phần tử từ mảng
  const getRandomTerms = (array: Term[], n: number) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(n, shuffled.length));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Chọn từ vựng để học</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-gray-700 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-bold text-white mb-1">
              Tìm kiếm từ vựng
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập từ hoặc nghĩa..."
              className="w-full p-2 text-white rounded focus:outline-none border border-gray-600 bg-gray-600 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="md:w-1/4">
            <label htmlFor="level" className="block text-sm font-bold text-white mb-1">
              Cấp độ
            </label>
            <select
              id="level"
              value={levelFilter === null ? '' : levelFilter}
              onChange={(e) => setLevelFilter(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full p-2 text-white rounded focus:outline-none border border-gray-600 bg-gray-600 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tất cả cấp độ</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <option key={level} value={level}>
                  Cấp độ {level}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:w-1/4">
            <label htmlFor="count" className="block text-sm font-bold text-white mb-1">
              Số lượng từ
            </label>
            <input
              type="number"
              id="count"
              min="1"
              max="50"
              value={wordCount}
              onChange={(e) => setWordCount(parseInt(e.target.value, 10) || 10)}
              className="w-full p-2 text-white border border-gray-600 bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm font-bold text-white">
            Đã chọn {selectedTerms.length} từ. {selectedTerms.length === 0 ? `Hệ thống sẽ chọn ngẫu nhiên ${wordCount} từ.` : ''}
          </p>
          <button
            onClick={() => {
              const allTermIds = filteredTerms.map(term => term.id);
              if (selectedTerms.length === allTermIds.length) {
                // Nếu đã chọn tất cả, bỏ chọn tất cả
                setSelectedTerms([]);
              } else {
                // Nếu chưa chọn tất cả, chọn tất cả
                setSelectedTerms(allTermIds);
              }
            }}
            className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500"
          >
            {selectedTerms.length === filteredTerms.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        </div>
        
        <div className="mb-6">
          <button
            onClick={handleStartLearning}
            disabled={filteredTerms.length === 0}
            className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 disabled:bg-gray-400"
          >
            Bắt đầu học
          </button>
        </div>
        
        {filteredTerms.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Không tìm thấy từ vựng nào phù hợp với điều kiện tìm kiếm.
          </p>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedTerms)
              .map(level => parseInt(level, 10))
              .sort((a, b) => a - b)
              .map(level => (
                <div key={level} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Cấp độ {level}</h3>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`level-${level}`}
                        checked={isLevelSelected(level)}
                        onChange={(e) => toggleLevelSelection(level, e.target.checked)}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                      />
                      <label htmlFor={`level-${level}`} className="text-sm text-white">
                        Chọn tất cả ({groupedTerms[level]?.length || 0} từ)
                      </label>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full rounded divide-y divide-gray-200">
                      <thead className="bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-sl font-bold text-white uppercase tracking-wider">
                            Chọn
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-sl font-bold text-white uppercase tracking-wider">
                            Từ vựng
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-sl font-bold text-white uppercase tracking-wider">
                            Nghĩa
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-sl font-bold text-white uppercase tracking-wider">
                            Loại từ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-700 divide-y divide-gray-200">
                        {groupedTerms[level]?.map((term) => (
                          <tr
                            key={term.id}
                            className="hover:bg-gray-800 cursor-pointer"
                            onClick={() => toggleTermSelection(term.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedTerms.includes(term.id)}
                                onChange={(e) => {
                                  e.stopPropagation(); // Ngăn chặn sự kiện click từ việc lan truyền lên hàng
                                  toggleTermSelection(term.id);
                                }}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sl font-bold text-white ">{term.term}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sl font-bold text-white">
                                {term.meanings.join('; ')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-white">{term.part_of_speech}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabSelectionPage;