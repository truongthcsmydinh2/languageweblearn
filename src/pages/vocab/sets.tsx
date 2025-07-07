import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useVocab } from '@/contexts/VocabContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { 
  PencilSquareIcon, 
  TrashIcon, 
  PlusIcon,
  FolderIcon,
  TagIcon,
  GlobeAltIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const VocabSetsPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { vocabSets, loading: vocabLoading, deleteVocabSet } = useVocab();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'mostTerms'>('newest');
  
  const handleDeleteClick = (setId: string) => {
    setDeleteTargetId(setId);
    setDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (deleteTargetId) {
      try {
        await deleteVocabSet(deleteTargetId);
      } catch (error) {
        console.error('Error deleting vocab set:', error);
      }
    }
    setDeleteModalOpen(false);
    setDeleteTargetId(null);
  };
  
  // Get filtered and sorted vocab sets
  const getFilteredAndSortedSets = () => {
    if (!vocabSets) return [];
    
    let sets = Object.entries(vocabSets).map(([id, set]) => ({
      ...set,
      id,
      termCount: set.terms ? set.terms.length : 0
    }));
    
    // Apply search filter
    if (searchTerm) {
      sets = sets.filter(set => 
        set.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (set.description && set.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      sets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sortBy === 'oldest') {
      sets.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    } else if (sortBy === 'alphabetical') {
      sets.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'mostTerms') {
      sets.sort((a, b) => b.termCount - a.termCount);
    }
    
    return sets;
  };
  
  const filteredSets = getFilteredAndSortedSets();
  
  // Format date
  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(Number(timestamp)).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (authLoading || vocabLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600">Đang tải bộ từ vựng...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header with breadcrumbs */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <a href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  Dashboard
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <a href="/vocab" className="ml-1 text-gray-500 hover:text-gray-700 md:ml-2">
                    Từ vựng
                  </a>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 font-medium text-gray-700 md:ml-2">
                    Quản lý bộ từ vựng
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý bộ từ vựng</h1>
              <p className="mt-1 text-sm text-gray-500">
                Tạo và quản lý các bộ từ vựng của bạn
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                onClick={() => router.push('/vocab/new')}
                icon={<PlusIcon className="w-4 h-4" />}
                variant="primary"
              >
                Thêm bộ mới
              </Button>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <Card elevation="md" className="mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm bộ từ vựng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              
              {/* Sort Dropdown */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="alphabetical">A-Z</option>
                  <option value="mostTerms">Nhiều từ nhất</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Main Content */}
        {filteredSets.length === 0 ? (
          <Card elevation="md">
            <div className="py-12 text-center">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có bộ từ vựng nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Không tìm thấy bộ từ vựng nào khớp với tìm kiếm của bạn' 
                  : 'Bắt đầu tạo bộ từ vựng mới ngay'}
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => router.push('/vocab/new')}
                  icon={<PlusIcon className="w-4 h-4" />}
                  variant="primary"
                >
                  Tạo bộ từ vựng
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSets.map((set) => (
              <Card key={set.id} elevation="md" className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="px-6 py-4 bg-primary-600 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {set.title}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {set.termCount} {set.termCount === 1 ? 'từ' : 'từ'}
                  </span>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {set.description || 'Không có mô tả'}
                    </p>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="ml-2 text-sm text-gray-500">
                        Ngôn ngữ: <span className="text-gray-900">{set.language || 'Tiếng Anh'}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="ml-2 text-sm text-gray-500">
                        Tạo: <span className="text-gray-900">{formatDate(set.createdAt)}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="ml-2 text-sm text-gray-500">
                        Tiến độ: <span className="text-gray-900">
                          {set.termCount > 0 
                            ? `${Math.round((set.terms?.filter(t => t.level >= 3).length || 0) / set.termCount * 100)}%`
                            : '0%'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/vocab/edit-set/${set.id}`)}
                      icon={<PencilSquareIcon className="w-4 h-4" />}
                    >
                      Sửa
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/vocab?setId=${set.id}`)}
                      >
                        Xem từ
                      </Button>
                      
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteClick(set.id)}
                        icon={<TrashIcon className="w-4 h-4" />}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Quick Tips */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Mẹo tổ chức bộ từ vựng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <TagIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Phân loại theo chủ đề:</strong> Tạo các bộ từ vựng theo chủ đề cụ thể như công việc, du lịch, hoặc học thuật.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Giới hạn kích thước:</strong> Giữ mỗi bộ từ vựng trong khoảng 20-30 từ để dễ học và quản lý.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ArrowPathIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Ôn tập đều đặn:</strong> Tạo bộ từ vựng "Cần ôn tập" để tập trung vào những từ khó nhớ.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <GlobeAltIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Theo cấp độ:</strong> Tạo các bộ từ vựng theo cấp độ khó dễ để tiến bộ dần dần.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Xác nhận xóa bộ từ vựng
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa bộ từ vựng này không? Tất cả từ vựng trong bộ này sẽ bị xóa. Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  Xác nhận xóa
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabSetsPage;
