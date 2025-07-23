import React from 'react';
import { Question, QuestionListProps } from '@/types/ielts-reading';
import { getQuestionTypeLabel } from '@/utils/ielts-reading/helpers';
import { Edit, Copy, Trash2, GripVertical, CheckCircle, XCircle } from 'lucide-react';

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  selectedQuestion,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onReorder,
  loading = false,
  showReorder = false,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading questions...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <CheckCircle className="mx-auto h-12 w-12 mb-2" />
          <p className="text-lg font-medium">No questions found</p>
          <p className="text-sm">Add questions to this passage to get started.</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, questionId: number) => {
    e.dataTransfer.setData('text/plain', questionId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedQuestionId = parseInt(e.dataTransfer.getData('text/plain'));
    const draggedQuestion = questions.find(q => q.id === draggedQuestionId);
    
    if (draggedQuestion && onReorder) {
      const newQuestions = [...questions];
      const draggedIndex = newQuestions.findIndex(q => q.id === draggedQuestionId);
      
      // Remove dragged question and insert at new position
      newQuestions.splice(draggedIndex, 1);
      newQuestions.splice(targetIndex, 0, draggedQuestion);
      
      // Update order indices
      const reorderedQuestions = newQuestions.map((q, index) => ({
        id: q.id,
        order_index: index + 1,
      }));
      
      onReorder(reorderedQuestions);
    }
  };

  return (
    <div className="space-y-3">
      {questions.map((question, index) => (
        <div
          key={question.id}
          className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
            selectedQuestion?.id === question.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect(question)}
          draggable={showReorder}
          onDragStart={(e) => handleDragStart(e, question.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {showReorder && (
                <div className="flex items-center mt-1">
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Q{question.question_number || index + 1}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {getQuestionTypeLabel(question.question_type)}
                  </span>
                  {question.is_required && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                
                <p className="text-gray-800 mb-2 leading-relaxed">
                  {question.question_text}
                </p>
                
                {/* Show options for multiple choice questions */}
                {(question.question_type === 'multiple_choice' || question.question_type === 'true_false_not_given') && question.options && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-500 mb-1">Options:</div>
                    <div className="grid grid-cols-1 gap-1">
                      {(() => {
                        // Parse options if it's a string, otherwise use as array
                        let optionsArray = question.options;
                        if (typeof question.options === 'string') {
                          try {
                            optionsArray = JSON.parse(question.options);
                          } catch (e) {
                            console.error('Error parsing options:', e);
                            optionsArray = [];
                          }
                        }
                        
                        // Ensure it's an array
                        if (!Array.isArray(optionsArray)) {
                          optionsArray = [];
                        }
                        
                        return optionsArray.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`text-sm px-2 py-1 rounded ${
                              option === question.correct_answer
                                ? 'bg-green-100 text-green-800 font-medium'
                                : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                            {option === question.correct_answer && (
                              <CheckCircle className="inline h-3 w-3 ml-1" />
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Show correct answer for other question types */}
                {question.question_type !== 'multiple_choice' && question.question_type !== 'true_false_not_given' && question.correct_answer && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">Answer: </span>
                    <span className="text-sm font-medium text-green-700">
                      {question.correct_answer}
                    </span>
                  </div>
                )}
                
                {/* Show explanation if available */}
                {question.explanation && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  <span>Order: {question.order_index || index + 1}</span>
                  {question.points && <span>Points: {question.points}</span>}
                  {question.difficulty && <span>Difficulty: {question.difficulty}</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(question);
                }}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit question"
              >
                <Edit className="h-4 w-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(question.id);
                }}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Duplicate question"
              >
                <Copy className="h-4 w-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
                    onDelete(question.id);
                  }
                }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;