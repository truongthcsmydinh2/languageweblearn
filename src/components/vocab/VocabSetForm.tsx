// src/components/vocab/VocabSetForm.tsx
import React, { useState } from 'react';
import { useVocab } from '../../hooks/useVocab';
import { useRouter } from 'next/router';

interface VocabSetFormProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
  };
  isEditing?: boolean;
}

const VocabSetForm: React.FC<VocabSetFormProps> = ({ 
  initialData = { name: '', description: '' }, 
  isEditing = false 
}) => {
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createSet, updateSet } = useVocab();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Tên bộ từ vựng không được để trống');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isEditing && initialData.id) {
        // Cập nhật bộ từ vựng
        const success = await updateSet(initialData.id, name, description);
        if (success) {
          router.push(`/vocab/${initialData.id}`);
        } else {
          throw new Error('Không thể cập nhật bộ từ vựng');
        }
      } else {
        // Tạo bộ từ vựng mới
        const newSet = await createSet(name, description);
        if (newSet) {
          router.push(`/vocab/${newSet.id}`);
        } else {
          throw new Error('Không thể tạo bộ từ vựng');
        }
      }
    } catch (err) {
      console.error('Error saving vocab set:', err);
      setError('Đã xảy ra lỗi khi lưu bộ từ vựng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Tên bộ từ vựng
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Nhập tên bộ từ vựng"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Mô tả
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Nhập mô tả cho bộ từ vựng này (tùy chọn)"
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo bộ từ vựng'}
        </button>
      </div>
    </form>
  );
};

export default VocabSetForm;