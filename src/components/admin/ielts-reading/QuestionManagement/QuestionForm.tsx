import React, { useState, useEffect } from 'react';
import { QuestionFormProps, QuestionFormData } from '@/types/ielts-reading';
import { QUESTION_TYPES } from '@/utils/ielts-reading/constants';
import { validateQuestionForm, autoClassifyQuestion, generateDefaultOptions } from '@/utils/ielts-reading/validation';
import { Save, X, AlertCircle, Plus, Trash2 } from 'lucide-react';

const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: '',
    question_type: 'multiple_choice',
    correct_answer: '',
    options: ['', '', '', ''],
    explanation: '',
    order_index: 1,
    points: 1,
    difficulty: 'medium',
    is_required: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoDetectedType, setAutoDetectedType] = useState<string | null>(null);

  // Initialize form data when question prop changes
  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text,
        question_type: question.question_type,
        correct_answer: question.correct_answer || '',
        options: question.options || ['', '', '', ''],
        explanation: question.explanation || '',
        order_index: question.order_index || 1,
        points: question.points || 1,
        difficulty: question.difficulty || 'medium',
        is_required: question.is_required ?? true,
      });
    } else {
      setFormData({
        question_text: '',
        question_type: 'multiple_choice',
        correct_answer: '',
        options: ['', '', '', ''],
        explanation: '',
        order_index: 1,
        points: 1,
        difficulty: 'medium',
        is_required: true,
      });
    }
    setErrors({});
    setAutoDetectedType(null);
  }, [question]);

  // Auto-detect question type when question text changes
  useEffect(() => {
    if (formData.question_text && !question) {
      const detectedType = autoClassifyQuestion(formData.question_text);
      if (detectedType !== formData.question_type) {
        setAutoDetectedType(detectedType);
      } else {
        setAutoDetectedType(null);
      }
    }
  }, [formData.question_text, formData.question_type, question]);

  const handleInputChange = (field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleQuestionTypeChange = (newType: string) => {
    const updatedFormData = { ...formData, question_type: newType };
    
    // Generate default options for certain question types
    if (newType === 'multiple_choice' && (!formData.options || formData.options.every(opt => !opt.trim()))) {
      updatedFormData.options = generateDefaultOptions(newType);
    } else if (newType === 'true_false_not_given') {
      updatedFormData.options = ['True', 'False', 'Not Given'];
    } else if (!['multiple_choice', 'true_false_not_given'].includes(newType)) {
      updatedFormData.options = [];
    }
    
    setFormData(updatedFormData);
    setAutoDetectedType(null);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    handleInputChange('options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(formData.options || []), ''];
    handleInputChange('options', newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = (formData.options || []).filter((_, i) => i !== index);
    handleInputChange('options', newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateQuestionForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Submit form
    await onSubmit(formData);
  };

  const isEditing = !!question;
  const needsOptions = ['multiple_choice', 'true_false_not_given'].includes(formData.question_type);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Question' : 'Create New Question'}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Question Text */}
        <div>
          <label htmlFor="question_text" className="block text-sm font-medium text-gray-700 mb-2">
            Question Text *
          </label>
          <textarea
            id="question_text"
            value={formData.question_text}
            onChange={(e) => handleInputChange('question_text', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.question_text ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter the question text"
            disabled={loading}
          />
          {errors.question_text && (
            <div className="mt-1 flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.question_text}
            </div>
          )}
          
          {/* Auto-detection suggestion */}
          {autoDetectedType && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Suggestion:</strong> This looks like a {QUESTION_TYPES.find(t => t.value === autoDetectedType)?.label} question.
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange(autoDetectedType)}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Apply suggestion
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Question Type and Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="question_type" className="block text-sm font-medium text-gray-700 mb-2">
              Question Type *
            </label>
            <select
              id="question_type"
              value={formData.question_type}
              onChange={(e) => handleQuestionTypeChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.question_type ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.question_type && (
              <div className="mt-1 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.question_type}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="order_index" className="block text-sm font-medium text-gray-700 mb-2">
              Question Number
            </label>
            <input
              type="number"
              id="order_index"
              value={formData.order_index}
              onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Options (for multiple choice questions) */}
        {needsOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options *
            </label>
            <div className="space-y-2">
              {(formData.options || []).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-8">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    disabled={loading}
                  />
                  {formData.question_type === 'multiple_choice' && (formData.options?.length || 0) > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove option"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {formData.question_type === 'multiple_choice' && (formData.options?.length || 0) < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </button>
            )}
            
            {errors.options && (
              <div className="mt-1 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.options}
              </div>
            )}
          </div>
        )}

        {/* Correct Answer */}
        <div>
          <label htmlFor="correct_answer" className="block text-sm font-medium text-gray-700 mb-2">
            Correct Answer *
          </label>
          {needsOptions ? (
            <select
              id="correct_answer"
              value={formData.correct_answer}
              onChange={(e) => handleInputChange('correct_answer', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.correct_answer ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value="">Select correct answer</option>
              {(formData.options || []).map((option, index) => (
                option.trim() && (
                  <option key={index} value={option}>
                    {String.fromCharCode(65 + index)}. {option}
                  </option>
                )
              ))}
            </select>
          ) : (
            <input
              type="text"
              id="correct_answer"
              value={formData.correct_answer}
              onChange={(e) => handleInputChange('correct_answer', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.correct_answer ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter the correct answer"
              disabled={loading}
            />
          )}
          {errors.correct_answer && (
            <div className="mt-1 flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.correct_answer}
            </div>
          )}
        </div>

        {/* Explanation */}
        <div>
          <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
            Explanation (Optional)
          </label>
          <textarea
            id="explanation"
            value={formData.explanation}
            onChange={(e) => handleInputChange('explanation', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Provide an explanation for the correct answer"
            disabled={loading}
          />
        </div>

        {/* Additional Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
              Points
            </label>
            <input
              type="number"
              id="points"
              value={formData.points}
              onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 1)}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) => handleInputChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Settings
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_required"
                checked={formData.is_required}
                onChange={(e) => handleInputChange('is_required', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="is_required" className="ml-2 text-sm text-gray-700">
                Required question
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
                {isEditing ? 'Update Question' : 'Create Question'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;