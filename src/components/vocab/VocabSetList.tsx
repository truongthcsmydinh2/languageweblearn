// src/components/vocab/VocabSetList.tsx
import React from 'react';
import { useVocab } from '../../hooks/useVocab';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const VocabSetList: React.FC = () => {
  const { vocabSets, loading, error, deleteSet } = useVocab();

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-24 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-lg">
        Đã xảy ra lỗi: {error}
      </div>
    );
  }

  const handleDelete = async (setId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bộ từ vựng này?')) {
      await deleteSet(setId);
    }
  };

  if (Object.keys(vocabSets).length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-medium text-gray-900">Chưa có bộ từ vựng nào</h3>
        <p className="mt-2 text-gray-600">
          Bắt đầu bằng cách tạo bộ từ vựng đầu tiên của bạn.
        </p>
        <div className="mt-4">
          <Link href="/vocab/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
            Tạo bộ từ vựng mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(vocabSets).map(([id, set]) => {
        const termCount = set.terms ? Object.keys(set.terms).length : 0;
        
        return (
          <div key={id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {set.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {set.description || 'Không có mô tả'}
              </p>
              <div className="mt-2 text-xs text-gray-400">
                Cập nhật: {format(new Date(set.updatedAt), 'dd/MM/yyyy', { locale: vi })}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {termCount} từ vựng
                </span>
                <div className="flex space-x-2">
                  <Link href={`/vocab/${id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Xem
                  </Link>
                  <Link href={`/vocab/edit/${id}`} className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                    Sửa
                  </Link>
                  <button
                    onClick={() => handleDelete(id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VocabSetList;