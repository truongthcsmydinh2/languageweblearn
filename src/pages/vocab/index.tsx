import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';

interface Term {
  id: number;
  vocab: string;
  meaning: string;
  level_en: number;
  level_vi: number;
  time_added: number;
  review_time_en: string;
  review_time_vi: string;
  example?: string;
  notes?: string;
  part_of_speech?: string;
  meanings?: string[];
  vietnamese?: string;
}

const PAGE_SIZE = 25;

const VocabListPage: React.FC = () => {
  const [vocabTerms, setVocabTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedTerms, setSelectedTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [isFirstLoading, setIsFirstLoading] = useState(true);

  // Hàm fetch dữ liệu từ API
  const fetchVocab = async (reset = false) => {
    if (reset) setIsFirstLoading(true);
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/vocab?limit=${PAGE_SIZE}&offset=${reset ? 0 : offset}`);
      const data = await res.json();
      if (reset) {
        setVocabList(data.data);
        setOffset(data.data.length);
        setHasMore(data.data.length < data.total);
      } else {
        setVocabList(prev => [...prev, ...data.data]);
        setOffset(offset + data.data.length);
        setHasMore(vocabList.length + data.data.length < data.total);
      }
      setTotal(data.total);
    } catch (e) {
      setHasMore(false);
    }
    setLoadingMore(false);
    if (reset) setIsFirstLoading(false);
  };

  useEffect(() => {
    fetchVocab(true);
    // eslint-disable-next-line
  }, []);

  // Infinite scroll: tự động load thêm khi kéo xuống cuối
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const handleScroll = () => {
      if (!loaderRef.current) return;
      const rect = loaderRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        fetchVocab();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, offset]);

  // XÓA TOÀN BỘ useEffect fetchVocabTerms và các state liên quan vocabTerms, setVocabTerms, loading, error, sortBy, searchTerm, v.v. Chỉ giữ lại logic phân trang mới với vocabList, fetchVocab, total, offset, loadingMore, hasMore.

  // Đảm bảo vocabList luôn là mảng
  const safeVocabList = Array.isArray(vocabList) ? vocabList : [];

  // Sắp xếp từ vựng
  const sortedTerms = [...safeVocabList].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.time_added).getTime() - new Date(a.time_added).getTime();
      case 'oldest':
        return new Date(a.time_added).getTime() - new Date(b.time_added).getTime();
      case 'alphabetical':
        return a.vocab.localeCompare(b.vocab);
      default:
        return 0;
    }
  });

  // Lọc từ vựng theo search term và level
  const filteredTerms = sortedTerms.filter(term => {
    // Consider a term to match the level filter if either language matches
    const matchesLevelFilter = levelFilter === 'all' || 
                              term.level_en === levelFilter || 
                              term.level_vi === levelFilter;
    
    return matchesLevelFilter && 
           (term.vocab.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((term.meanings?.[0] || term.vietnamese || '').toLowerCase().includes(searchTerm.toLowerCase())));
  });

  // Loại bỏ phân trang để hiển thị tất cả từ vựng
  const termsToDisplay = filteredTerms;

  // Xử lý tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Xử lý sắp xếp
  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'newest' | 'oldest' | 'alphabetical');
  };

  // Xử lý lọc theo level
  const handleLevelFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
  };

  // Xử lý xóa từ
  const handleDelete = async () => {
    if (deleteConfirmText === 'DELETE') {
      try {
        setIsLoading(true);

        // Lấy danh sách ID từ các từ đã chọn
        const termIds = selectedTerms.map(term => term.id).filter(Boolean);
        
        // Kiểm tra có ID nào không
        if (termIds.length === 0) {
          alert('Không thể xóa: không tìm thấy ID của các từ đã chọn');
          return;
        }
        
        // Gọi API xóa nhiều từ cùng lúc
        const response = await fetch('/api/vocab/delete-multiple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ termIds }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete terms');
        }

        // Reset states
        setIsDeleteModalOpen(false);
        setDeleteConfirmText('');
        
        // Cập nhật danh sách từ vựng bằng cách loại bỏ các từ đã xóa
        const updatedVocabList = vocabList.filter(
          term => !selectedTerms.some(selected => selected.id === term.id)
        );
        setVocabList(updatedVocabList);
        setSelectedTerms([]);

        alert(`Đã xóa thành công ${result.deletedCount || selectedTerms.length} từ!`);
      } catch (error) {
        alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể xóa từ vựng'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Helper function to render level badge
  const renderLevelBadge = (level: number) => {
    let bgColor = '';
    let textColor = '';
    let label = '';
    
    if (level === 0) {
      bgColor = 'bg-error-200';
      textColor = 'text-gray-800';
      label = 'Mới';
    } else if (level >= 1 && level <= 3) {
      bgColor = 'bg-warning-200';
      textColor = 'text-gray-800';
      label = 'Đang học';
    } else if (level >= 4 && level <= 7) {
      bgColor = 'bg-success-200';
      textColor = 'text-gray-800';
      label = 'Cơ bản';
    } else {
      bgColor = 'bg-primary-200';
      textColor = 'text-gray-800';
      label = 'Thành thạo';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {label} ({level})
      </span>
    );
  };

  // Helper function to render review time with status
  const renderReviewTime = (reviewTime: string) => {
    const reviewDate = new Date(reviewTime);
    const today = new Date();
    
    // Reset hours, minutes, seconds, and milliseconds for date comparison
    today.setHours(0, 0, 0, 0);
    const reviewDateOnly = new Date(reviewDate);
    reviewDateOnly.setHours(0, 0, 0, 0);
    
    // Compare dates
    let statusText = '';
    let statusClass = '';
    
    if (reviewDateOnly.getTime() < today.getTime()) {
      statusText = 'Quá hạn';
      statusClass = 'text-red-600';
    } else if (reviewDateOnly.getTime() === today.getTime()) {
      statusText = 'Hôm nay';
      statusClass = 'text-green-600';
    } else {
      statusText = 'Sắp tới';
      statusClass = 'text-white';
    }
    
    return (
      <div className="flex flex-col items-center">
        <span className={statusClass + ' font-medium'}>
          {reviewDate.toLocaleDateString('vi-VN')}
        </span>
        <span className={`text-xs ${statusClass}`}>
          {statusText}
        </span>
      </div>
    );
  };

  // Thêm hàm renderPartOfSpeech sau hàm renderReviewTime
  const renderPartOfSpeech = (partOfSpeech?: string) => {
    if (!partOfSpeech) return null;
    
    const posStyles = {
      noun: 'bg-blue-100 text-blue-800 border-blue-300',
      verb: 'bg-green-100 text-green-800 border-green-300',
      adjective: 'bg-purple-100 text-purple-800 border-purple-300',
      adverb: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      preposition: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      conjunction: 'bg-pink-100 text-pink-800 border-pink-300',
      pronoun: 'bg-red-100 text-red-800 border-red-300',
      interjection: 'bg-orange-100 text-orange-800 border-orange-300',
      phrase: 'bg-teal-100 text-teal-800 border-teal-300'
    };
    
    const posLabels = {
      noun: 'Danh từ',
      verb: 'Động từ',
      adjective: 'Tính từ',
      adverb: 'Trạng từ',
      preposition: 'Giới từ',
      conjunction: 'Liên từ',
      pronoun: 'Đại từ',
      interjection: 'Thán từ',
      phrase: 'Cụm từ'
    };
    
    const style = posStyles[partOfSpeech as keyof typeof posStyles] || 'bg-gray-100 text-gray-800 border-gray-300';
    const label = posLabels[partOfSpeech as keyof typeof posLabels] || partOfSpeech;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${style} transition-all duration-200 hover:shadow-md`}>
        {label}
      </span>
    );
  };

  // Sửa hàm resetLevel:
  const resetLevel = async (termId: number, type: 'en' | 'vi' | 'all') => {
    try {
      const response = await fetch('/api/vocab/reset-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termId, type })
      });
      if (!response.ok) throw new Error('Lỗi khi reset cấp độ');
      // Cập nhật lại UI
      const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      setVocabList(prev => prev.map(term =>
        (!termId || term.id === termId)
          ? {
              ...term,
              level_en: 0,
              level_vi: 0,
              review_time_en: now,
              review_time_vi: now
            }
          : term
      ));
      alert('Đã reset thành công!');
    } catch (err) {
      alert('Lỗi khi reset cấp độ!');
    }
  };

  if (isFirstLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-800 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-50 mb-4">Đã xảy ra lỗi</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary-200 text-gray-800 rounded-md hover:bg-primary-300"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-50 mb-4 md:mb-0">Danh sách từ vựng</h1>
          <div className="space-x-2">
            <Link href="/vocab/add" className="px-4 py-2 bg-primary-200 text-gray-800 rounded-md hover:bg-primary-300">
              Thêm từ mới
            </Link>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-error-200 text-gray-800 rounded-md hover:bg-error-600 disabled:opacity-50"
              disabled={selectedTerms.length === 0}
            >
              Xóa ({selectedTerms.length})
            </button>
          </div>
        </div>
        
        {/* Tìm kiếm và lọc */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-400 mb-1">Tìm kiếm</label>
            <input
              type="text"
              id="search"
              placeholder="Tìm từ vựng..."
              value={searchTerm}
              onChange={handleSearch}
              className="block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-700 text-gray-50 rounded-md focus:outline-none focus:ring-primary-200 focus:border-primary-200"
            />
          </div>
          
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-400 mb-1">Sắp xếp theo</label>
            <select
              id="sort"
              value={sortBy}
              onChange={handleSort}
              className="block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-50 rounded-md focus:outline-none focus:ring-primary-200 focus:border-primary-200"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="alphabetical">A-Z</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-400 mb-1">Cấp độ</label>
            <select
              id="level"
              value={levelFilter === 'all' ? 'all' : levelFilter.toString()}
              onChange={handleLevelFilter}
              className="block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-50 rounded-md focus:outline-none focus:ring-primary-200 focus:border-primary-200"
            >
              <option value="all">Tất cả cấp độ</option>
              <option value="0">Mới (0)</option>
              <option value="1">Cấp 1</option>
              <option value="2">Cấp 2</option>
              <option value="3">Cấp 3</option>
              <option value="4">Cấp 4</option>
              <option value="5">Cấp 5</option>
              <option value="6">Cấp 6</option>
              <option value="7">Cấp 7</option>
              <option value="8">Cấp 8</option>
              <option value="9">Cấp 9</option>
              <option value="10">Cấp 10</option>
            </select>
          </div>
        </div>
        
        {/* Hiển thị kết quả tìm kiếm */}
        <p className="text-gray-400 mb-6">
          {filteredTerms.length} từ được tìm thấy
          {searchTerm && ` với từ khóa "${searchTerm}"`}
          {levelFilter !== 'all' && ` và cấp độ ${levelFilter}`}
        </p>
        
        {/* Bảng từ vựng */}
        <div className="bg-gray-700 rounded-lg overflow-hidden shadow-md">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 text-primary-200 border-gray-600 rounded focus:ring-primary-200 bg-gray-700"
                    checked={selectedTerms.length === termsToDisplay.length && termsToDisplay.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTerms(termsToDisplay);
                      } else {
                        setSelectedTerms([]);
                      }
                    }}
                  />
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Từ vựng
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Nghĩa
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  <div className="flex items-center space-x-2">
                    <span>Cấp độ (EN/VI)</span>
                    <button
                      title="Reset tất cả từ"
                      onClick={async () => {
                        if (!window.confirm('Bạn chắc chắn muốn reset tất cả cấp độ và thời gian ôn tập của mọi từ?')) return;
                        try {
                          const response = await fetch('/api/vocab/reset-level', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'all' })
                          });
                          if (!response.ok) throw new Error('Lỗi khi reset tất cả');
                          setVocabList(prev => prev.map(term => ({
                            ...term,
                            level_en: 0,
                            level_vi: 0,
                            review_time_en: '0000-00-00',
                            review_time_vi: '0000-00-00'
                          })));
                          alert('Đã reset tất cả thành công!');
                        } catch (err) {
                          alert('Lỗi khi reset tất cả!');
                        }
                      }}
                      className="ml-2 px-3 py-1 bg-error-200 text-gray-800 rounded hover:bg-error-300 text-xs font-bold"
                    >
                      Reset tất cả
                    </button>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  <div className="flex flex-col items-center">
                    <span>Lần ôn tới EN</span>
                    <span>Lần ôn tới VI</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Từ loại
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600 bg-gray-700">
              {termsToDisplay.length > 0 ? (
                termsToDisplay.map((term) => (
                  <tr key={term.id} className="hover:bg-gray-600">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-primary-200 border-gray-600 rounded focus:ring-primary-200 bg-gray-700"
                        checked={selectedTerms.some(selected => selected.id === term.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTerms([...selectedTerms, term]);
                          } else {
                            setSelectedTerms(selectedTerms.filter(selected => selected.id !== term.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-lg font-semibold text-gray-50">{term.vocab}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-lg font-semibold text-gray-300">{term.meanings?.[0] || term.vietnamese || ''}</div> 
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex space-x-2 items-center">
                        {renderLevelBadge(term.level_en)}
                        {renderLevelBadge(term.level_vi)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-lg text-gray-400 hidden lg:table-cell text-center align-middle">
                      <div className="flex flex-col items-center">
                        <span>{renderReviewTime(term.review_time_en)}</span>
                        <span>{renderReviewTime(term.review_time_vi)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {renderPartOfSpeech(term.part_of_speech)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-sm font-medium">
                      <Link href={`/vocab/${term.id}`} className="text-secondary-200 hover:text-secondary-300 mr-3">
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-400">
                    Không tìm thấy từ vựng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal xác nhận xóa */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Xác nhận xóa từ vựng">
        <div className="p-6">
          <p className="text-gray-50 mb-4">
            Bạn chắc chắn muốn xóa {selectedTerms.length} từ đã chọn? Hành động này không thể hoàn tác.
          </p>
          <p className="text-gray-400 mb-4">
            Nhập "DELETE" để xác nhận xóa:
          </p>
          <input 
            type="text" 
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-600 mb-4 placeholder-gray-400 bg-gray-700 text-gray-50 rounded-md focus:outline-none focus:ring-primary-200 focus:border-primary-200"
            placeholder="DELETE"
          />
          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-gray-50 rounded-md hover:bg-gray-500"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button 
              onClick={handleDelete}
              className="px-4 py-2 bg-error-200 text-gray-800 rounded-md hover:bg-error-600 disabled:opacity-50"
              disabled={deleteConfirmText !== 'DELETE' || isLoading}
            >
              {isLoading ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </Modal>
      <div ref={loaderRef} className="flex justify-center py-6">
        {loadingMore && <span className="text-gray-400">Đang tải...</span>}
        {!hasMore && <span className="text-gray-400">Đã tải hết tất cả từ vựng.</span>}
      </div>
    </div>
  );
};

export default VocabListPage;
