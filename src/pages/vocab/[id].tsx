import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useVocab } from '@/contexts/VocabContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { 
  ArrowLeftIcon,
  PlusCircleIcon,
  DocumentTextIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const AddVocabPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { vocabSets, addTerm, addVocabSet, loading: vocabLoading } = useVocab();
  
  // Form state
  const [vocab, setVocab] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSetId, setSelectedSetId] = useState('');
  const [newSetName, setNewSetName] = useState('');
  const [isCreatingNewSet, setIsCreatingNewSet] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Set default set if none selected and sets are loaded
  useEffect(() => {
    if (!selectedSetId && vocabSets && Object.keys(vocabSets).length > 0) {
      setSelectedSetId(Object.keys(vocabSets)[0]);
    }
  }, [vocabSets, selectedSetId]);
  
  const validateForm = () => {
    const errors = {};
    
    if (!vocab.trim()) {
      errors.vocab = 'Vui lòng nhập từ vựng';
    }
    
    if (!meaning.trim()) {
      errors.meaning = 'Vui lòng nhập nghĩa';
    }
    
    if (isCreatingNewSet && !newSetName.trim()) {
      errors.newSetName = 'Vui lòng nhập tên bộ từ vựng mới';
    }
    
    if (!isCreatingNewSet && !selectedSetId) {
      errors.selectedSetId = 'Vui lòng chọn bộ từ vựng';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      let setId = selectedSetId;
      
      // If creating a new set, create it first
      if (isCreatingNewSet) {
        setId = await addVocabSet({
          title: newSetName,
          description: '',
          language: 'en', // Default language
          createdAt: new Date().getTime()
        });
      }
      
      // Now add the term to the selected/created set
      await addTerm({
        vocab,
        meaning,
        example: example || '',
        notes: notes || '',
        level: 0,
        timeAdded: new Date().getTime(),
        setId
      });
      
      // Show success message
      setShowSuccessMessage(true);
      
      // Reset form
      setVocab('');
      setMeaning('');
      setExample('');
      setNotes('');
      
      // After 2 seconds, hide success message
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error adding term:', error);
      setFormErrors({ submit: 'Có lỗi xảy ra khi lưu từ vựng. Vui lòng thử lại.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (authLoading || vocabLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                    Thêm từ mới
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thêm từ vựng mới</h1>
              <p className="mt-1 text-sm text-gray-500">
                Nhập thông tin để thêm từ vựng mới vào bộ sưu tập của bạn
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                variant="outline"
                onClick={() => router.push('/vocab')}
                icon={<ArrowLeftIcon className="w-4 h-4" />}
              >
                Quay lại
              </Button>
            </div>
          </div>
        </div>
        
        <Card elevation="md">
          <div className="p-6">
            {showSuccessMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Thành công! </strong>
                <span className="block sm:inline">Đã thêm từ vựng mới thành công.</span>
              </div>
            )}
            
            {formErrors.submit && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Lỗi! </strong>
                <span className="block sm:inline">{formErrors.submit}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin từ vựng</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="vocab" className="block text-sm font-medium text-gray-700 mb-1">
                        Từ vựng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="vocab"
                        value={vocab}
                            onChange={(e) => setVocab(e.target.value)}
                            className={`mt-1 block w-full border ${formErrors.vocab ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                            placeholder="Nhập từ vựng mới"
                          />
                          {formErrors.vocab && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.vocab}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="meaning" className="block text-sm font-medium text-gray-700 mb-1">
                            Nghĩa <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="meaning"
                            value={meaning}
                            onChange={(e) => setMeaning(e.target.value)}
                            className={`mt-1 block w-full border ${formErrors.meaning ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                            placeholder="Nhập nghĩa của từ"
                          />
                          {formErrors.meaning && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.meaning}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <label htmlFor="example" className="block text-sm font-medium text-gray-700 mb-1">
                          Ví dụ
                        </label>
                        <textarea
                          id="example"
                          value={example}
                          onChange={(e) => setExample(e.target.value)}
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="Nhập một câu ví dụ sử dụng từ này (không bắt buộc)"
                        />
                      </div>
                      
                      <div className="mt-6">
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                          Ghi chú
                        </label>
                        <textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="Thêm ghi chú về cách sử dụng, phát âm, v.v. (không bắt buộc)"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Bộ từ vựng</h3>
                      
                      <div className="mb-4">
                        <div className="flex items-center">
                          <input
                            id="existingSet"
                            name="setType"
                            type="radio"
                            checked={!isCreatingNewSet}
                            onChange={() => setIsCreatingNewSet(false)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <label htmlFor="existingSet" className="ml-3 block text-sm font-medium text-gray-700">
                            Thêm vào bộ có sẵn
                          </label>
                        </div>
                        
                        {!isCreatingNewSet && (
                          <div className="mt-3 ml-7">
                            <select
                              id="selectedSetId"
                              value={selectedSetId}
                              onChange={(e) => setSelectedSetId(e.target.value)}
                              className={`mt-1 block w-full border ${formErrors.selectedSetId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                              disabled={isCreatingNewSet}
                            >
                              <option value="" disabled>Chọn bộ từ vựng</option>
                              {vocabSets && Object.entries(vocabSets).map(([id, set]) => (
                                <option key={id} value={id}>
                                  {set.title} ({set.terms ? set.terms.length : 0} từ)
                                </option>
                              ))}
                            </select>
                            {formErrors.selectedSetId && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.selectedSetId}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center">
                          <input
                            id="newSet"
                            name="setType"
                            type="radio"
                            checked={isCreatingNewSet}
                            onChange={() => setIsCreatingNewSet(true)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <label htmlFor="newSet" className="ml-3 block text-sm font-medium text-gray-700">
                            Tạo bộ mới
                          </label>
                        </div>
                        
                        {isCreatingNewSet && (
                          <div className="mt-3 ml-7">
                            <input
                              type="text"
                              id="newSetName"
                              value={newSetName}
                              onChange={(e) => setNewSetName(e.target.value)}
                              className={`mt-1 block w-full border ${formErrors.newSetName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                              placeholder="Nhập tên bộ từ vựng mới"
                              disabled={!isCreatingNewSet}
                            />
                            {formErrors.newSetName && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.newSetName}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-200 flex items-center justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="mr-3"
                        onClick={() => router.push('/vocab')}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        icon={<PlusCircleIcon className="w-4 h-4" />}
                        loading={isSaving}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Đang lưu...' : 'Lưu từ mới'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </Card>
            
            {/* Quick Tips */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mẹo nhỏ khi thêm từ mới</h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Ví dụ hữu ích:</strong> Tạo ví dụ có ngữ cảnh để dễ nhớ từ vựng hơn.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <BookOpenIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Tổ chức bộ từ vựng:</strong> Nhóm từ theo chủ đề sẽ giúp bạn học hiệu quả hơn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    export default AddVocabPage;
                            