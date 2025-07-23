import React, { useState, useEffect } from 'react';
import { PassageFormProps, PassageFormData } from '@/types/ielts-reading';
import { PASSAGE_LEVELS } from '@/utils/ielts-reading/constants';
import { validatePassageForm } from '@/utils/ielts-reading/validation';
import { Save, X, AlertCircle } from 'lucide-react';

const PassageForm: React.FC<PassageFormProps> = ({
  passage,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<PassageFormData>({
    title: '',
    content: '',
    level: 'intermediate',
    category: '',
    time_limit: 20,
    is_active: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wordCount, setWordCount] = useState(0);

  // Initialize form data when passage prop changes
  useEffect(() => {
    if (passage) {
      setFormData({
        title: passage.title,
        content: passage.content,
        level: passage.level,
        category: passage.category || '',
        time_limit: passage.time_limit || 20,
        is_active: passage.is_active,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        level: 'intermediate',
        category: '',
        time_limit: 20,
        is_active: true,
      });
    }
    setErrors({});
  }, [passage]);

  // Update word count when content changes
  useEffect(() => {
    const words = formData.content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [formData.content]);

  const handleInputChange = (field: keyof PassageFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validatePassageForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Submit form
    await onSubmit(formData);
  };

  const isEditing = !!passage;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Passage' : 'Create New Passage'}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter passage title"
            disabled={loading}
          />
          {errors.title && (
            <div className="mt-1 flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.title}
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content * <span className="text-gray-500">({wordCount} words)</span>
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            rows={12}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter the reading passage content"
            disabled={loading}
          />
          {errors.content && (
            <div className="mt-1 flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.content}
            </div>
          )}
          <div className="mt-1 text-xs text-gray-500">
            Recommended: 300-800 words for IELTS Reading passages
          </div>
        </div>

        {/* Level and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
              Level *
            </label>
            <select
              id="level"
              value={formData.level}
              onChange={(e) => handleInputChange('level', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.level ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              {PASSAGE_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {errors.level && (
              <div className="mt-1 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.level}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Science, History, Technology"
              disabled={loading}
            />
          </div>
        </div>

        {/* Time Limit and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="time_limit" className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              id="time_limit"
              value={formData.time_limit}
              onChange={(e) => handleInputChange('time_limit', parseInt(e.target.value) || 20)}
              min="1"
              max="60"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.time_limit ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.time_limit && (
              <div className="mt-1 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.time_limit}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Active (visible to students)
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2 inline" />
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2 inline" />
                {isEditing ? 'Update Passage' : 'Create Passage'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PassageForm;