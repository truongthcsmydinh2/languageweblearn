import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Term {
  id: number;
  vocab: string;
  meanings: string[];
  level_en: number;
  level_vi: number;
  min_level: number;
  part_of_speech?: string;
}

const VocabListPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [minLevel, setMinLevel] = useState<number | null>(null);
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Lấy danh sách từ vựng
    fetchVocab();
  }, [user, router, searchTerm, minLevel]);

  const fetchVocab = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Xây dựng URL với các tham số tìm kiếm
      let url = '/api/vocab?limit=50';
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      if (minLevel !== null) {
        url += `&min_level=${minLevel}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'firebase_uid': user?.uid || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTerms(data.data || []);
      } else {
        console.error('Error fetching vocabulary:', await response.text());
        setError('Không thể tải danh sách từ vựng');
      }
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      setError('Đã xảy ra lỗi khi tải danh sách từ vựng');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelFilter = (level: number | null) => {
    setMinLevel(level);
  };

  const handleLearnSelected = () => {
    router.push('/learning/example');
  };

  if (loading && terms.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Danh sách từ vựng</h1>
      
      <div className="bg-gray-700 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm từ vựng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleLevelFilter(null)}
              className={`px-3 py-1 rounded ${minLevel === null ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleLevelFilter(0)}
              className={`px-3 py-1 rounded ${minLevel === 0 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Mới
            </button>
            <button
              onClick={() => handleLevelFilter(1)}
              className={`px-3 py-1 rounded ${minLevel === 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Cấp 1
            </button>
            <button
              onClick={() => handleLevelFilter(2)}
              className={`px-3 py-1 rounded ${minLevel === 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Cấp 2+
            </button>
          </div>
          
          <button
            onClick={handleLearnSelected}
            className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
          >
            Học từ vựng
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {terms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg">Không tìm thấy từ vựng nào.</p>
            <button
              onClick={() => router.push('/vocab/add')}
              className="mt-4 bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
            >
              Thêm từ vựng mới
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-left">Từ vựng</th>
                  <th className="py-2 px-4 text-left">Nghĩa</th>
                  <th className="py-2 px-4 text-left">Loại từ</th>
                  <th className="py-2 px-4 text-center">Cấp độ</th>
                </tr>
              </thead>
              <tbody>
                {terms.map((term) => (
                  <tr key={term.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{term.vocab}</td>
                    <td className="py-3 px-4">{Array.isArray(term.meanings) ? term.meanings.join(', ') : term.meanings}</td>
                    <td className="py-3 px-4">{term.part_of_speech || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold
                        ${term.min_level === 0 ? 'bg-gray-200 text-gray-700' : 
                          term.min_level === 1 ? 'bg-blue-200 text-blue-700' :
                          term.min_level === 2 ? 'bg-green-200 text-green-700' :
                          term.min_level >= 3 ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-700'}
                      `}>
                        {term.min_level === 0 ? 'Mới' : `Cấp ${term.min_level}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabListPage;