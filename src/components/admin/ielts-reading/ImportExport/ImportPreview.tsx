import React, { useState } from 'react';
import { FileText, Users, Clock, BookOpen, AlertTriangle, CheckCircle, Info, Eye, ChevronDown, ChevronRight, List, Hash, Database } from 'lucide-react';
import { ImportPreviewData } from '@/types/ielts-reading/import.types';
import { getQuestionTypeRequirements } from '@/utils/ielts-reading/dataTransformer';

interface ImportPreviewComponentProps {
  previewData: ImportPreviewData | null;
  validationResult: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  onImport: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

const ImportPreview: React.FC<ImportPreviewComponentProps> = ({
  previewData,
  validationResult: validation,
  onBack,
  onImport,
  isProcessing
}) => {
  console.log('[ImportPreview] Component rendered with props:', {
    hasPreviewData: !!previewData,
    validationIsValid: validation?.isValid,
    validationErrors: validation?.errors?.length || 0,
    validationWarnings: validation?.warnings?.length || 0,
    isProcessing,
    onImportType: typeof onImport
  });
  const [expandedSections, setExpandedSections] = useState<{
    questionGroups: { [key: number]: boolean };
    passageContent: boolean;
  }>({
    questionGroups: {},
    passageContent: false
  });

  const toggleQuestionGroup = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      questionGroups: {
        ...prev.questionGroups,
        [index]: !prev.questionGroups[index]
      }
    }));
  };

  const togglePassageContent = () => {
    setExpandedSections(prev => ({
      ...prev,
      passageContent: !prev.passageContent
    }));
  };
  if (!previewData || !validation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No preview data available</p>
      </div>
    );
  }
  const getQuestionTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'multiple_choice_single': '🔘',
      'choose_two_letters': '✌️',
      'true_false_not_given': '✅',
      'yes_no_not_given': '👍',
      'matching_headings': '🔗',
      'matching_phrases': '🔀',
      'matching_features': '🏷️',
      'matching_sentence_endings': '📝',
      'sentence_completion': '✏️',
      'summary_completion': '📋',
      'note_table_flowchart_diagram_completion': '📊',
      'short_answer': '💬'
    };
    return iconMap[type] || '❓';
  };

  const getLevelColor = (level: string) => {
    const colorMap: Record<string, string> = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    return colorMap[level] || 'bg-gray-100 text-gray-800';
  };

  const formatQuestionType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      <div className={`p-4 rounded-lg border ${
        validation.isValid 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {validation.isValid ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <h3 className={`font-semibold ${
            validation.isValid ? 'text-green-800' : 'text-red-800'
          }`}>
            {validation.isValid ? 'Validation Passed' : 'Validation Failed'}
          </h3>
        </div>
        
        {validation.errors.length > 0 && (
          <div className="mb-3">
            <h4 className="font-medium text-red-700 mb-1">Errors ({validation.errors.length}):</h4>
            <ul className="text-sm text-red-600 space-y-1">
              {validation.errors.slice(0, 5).map((error, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
              {validation.errors.length > 5 && (
                <li className="text-red-500 italic">... and {validation.errors.length - 5} more errors</li>
              )}
            </ul>
          </div>
        )}
        
        {validation.warnings.length > 0 && (
          <div>
            <h4 className="font-medium text-yellow-700 mb-1">Warnings ({validation.warnings.length}):</h4>
            <ul className="text-sm text-yellow-600 space-y-1">
              {validation.warnings.slice(0, 3).map((warning, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
              {validation.warnings.length > 3 && (
                <li className="text-yellow-500 italic">... and {validation.warnings.length - 3} more warnings</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Passage Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Thông tin bài đọc</h3>
          </div>
          <button
            onClick={togglePassageContent}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {expandedSections.passageContent ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 text-lg">{previewData.passage.title}</h4>
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(previewData.passage.level)}`}>
                {previewData.passage.level.toUpperCase()}
              </span>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <BookOpen className="h-4 w-4" />
                <span>{previewData.passage.wordCount} từ</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{previewData.passage.timeLimit} phút</span>
              </div>
            </div>
          </div>

          {/* Passage content - expandable */}
          <div className="mt-4">
            {!expandedSections.passageContent ? (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-600">
                  Nhấn vào mũi tên để xem nội dung chi tiết các đoạn văn.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-900 mb-2">Nội dung bài đọc</h5>
                  <div className="text-sm text-blue-800 space-y-2">
                    {previewData.passageContent && previewData.passageContent.length > 0 ? (
                      previewData.passageContent.map((paragraph, index) => (
                        <div key={index} className="p-3 bg-white rounded border">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              Đoạn {index + 1}
                            </span>
                          </div>
                          <p className="mt-2 text-gray-700 leading-relaxed">
                            {paragraph.length > 200 ? `${paragraph.substring(0, 200)}...` : paragraph}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 italic">
                        Nội dung đoạn văn sẽ được hiển thị sau khi import thành công.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{previewData.statistics.totalQuestions}</div>
          <div className="text-sm text-blue-700">Tổng số câu hỏi</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{previewData.statistics.questionGroupsCount}</div>
          <div className="text-sm text-green-700">Nhóm câu hỏi</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{previewData.statistics.questionTypes}</div>
          <div className="text-sm text-purple-700">Loại câu hỏi</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(previewData.statistics.totalQuestions / previewData.statistics.questionGroupsCount * 10) / 10}
          </div>
          <div className="text-sm text-orange-700">TB câu hỏi/nhóm</div>
        </div>
      </div>

      {/* Question Groups */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Nhóm câu hỏi</h3>
        </div>
        
        <div className="space-y-4">
          {previewData.questionGroups.map((group, index) => {
            const requirements = getQuestionTypeRequirements(group.type);
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getQuestionTypeIcon(group.type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                      <p className="text-sm text-gray-600">{formatQuestionType(group.type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {group.questionsCount} câu hỏi
                      </div>
                      <div className="text-xs text-gray-500">Q{group.questionRange}</div>
                    </div>
                    <button
                      onClick={() => toggleQuestionGroup(index)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {expandedSections.questionGroups?.[index] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                      <p className="mb-1">{requirements.description}</p>
                      <p className="text-xs text-gray-600">
                        <strong>Định dạng đáp án:</strong> {requirements.answerFormat}
                      </p>
                      {requirements.requiresOptions && (
                        <p className="text-xs text-gray-600">
                          <strong>Yêu cầu lựa chọn:</strong> {requirements.optionsCount || 'Biến đổi'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Details */}
                {expandedSections.questionGroups?.[index] && (
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-3">Chi tiết câu hỏi</h4>
                    
                    {/* Show contentSegments for completion types */}
                    {group.type === 'note_table_flowchart_diagram_completion' && group.contentSegments && (
                      <div className="mb-4 p-3 bg-blue-50 rounded border">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Nội dung hoàn thành:</h5>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {group.contentSegments.map((segment, segIndex) => {
                            if (segment.type === 'text') {
                              return (
                                <span key={segIndex}>
                                  {segment.value}
                                </span>
                              );
                            } else if (segment.type === 'blank') {
                              const questionForBlank = group.questions?.find(q => 
                                (q as any).questionNumber === segment.questionId || 
                                (q as any).id === segment.questionId
                              );
                              return (
                                <span 
                                  key={segIndex} 
                                  className="inline-block bg-yellow-200 px-2 py-1 mx-1 rounded border-2 border-dashed border-yellow-400 font-medium text-yellow-800"
                                  title={`Câu hỏi ${segment.questionId}: ${questionForBlank?.correctAnswer || questionForBlank?.answer || 'N/A'}`}
                                >
                                  [{segment.questionId}] ______
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {group.questions && group.questions.length > 0 ? (
                        group.questions.map((question, qIndex) => {
                          // For completion types, show more context
                          const isCompletionType = group.type === 'note_table_flowchart_diagram_completion';
                          const questionId = (question as any).questionNumber || (question as any).id || qIndex + 1;
                          
                          return (
                            <div key={qIndex} className="p-3 bg-gray-50 rounded border">
                              <div className="flex items-start gap-3">
                                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                  Q{questionId}
                                </span>
                                <div className="flex-1">
                                  {isCompletionType ? (
                                    <div>
                                      <p className="text-sm text-gray-800 font-medium mb-1">
                                        Điền vào chỗ trống số {questionId}
                                      </p>
                                      <p className="text-xs text-gray-600 mb-2">
                                        Vị trí: Xem nội dung hoàn thành ở trên
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-800 font-medium mb-1">
                                      {question.questionText || question.content || `Câu hỏi ${qIndex + 1}`}
                                    </p>
                                  )}
                                  
                                  {question.options && question.options.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-600 mb-1">Lựa chọn:</p>
                                      <div className="grid grid-cols-2 gap-1">
                                        {question.options.map((option, oIndex) => (
                                          <span key={oIndex} className="text-xs text-gray-700 bg-white px-2 py-1 rounded">
                                            {String.fromCharCode(65 + oIndex)}. {option.length > 30 ? `${option.substring(0, 30)}...` : option}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="mt-2 flex items-center gap-4">
                                    <span className="text-xs text-blue-600">
                                      <strong>Đáp án:</strong> {question.correctAnswer || question.answer || 'N/A'}
                                    </span>
                                    {question.explanation && (
                                      <span className="text-xs text-gray-500">
                                        <strong>Giải thích:</strong> {question.explanation.length > 50 ? `${question.explanation.substring(0, 50)}...` : question.explanation}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p>Nhóm này có {group.questionsCount} câu hỏi từ Q{group.questionRange}.</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Chi tiết câu hỏi sẽ được hiển thị sau khi import thành công.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Types Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt loại câu hỏi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {previewData.statistics.uniqueTypes.map((type, index) => {
            const count = previewData.questionGroups.filter(g => g.type === type).length;
            const totalQuestions = previewData.questionGroups
              .filter(g => g.type === type)
              .reduce((sum, g) => sum + g.questionsCount, 0);
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getQuestionTypeIcon(type)}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatQuestionType(type)}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>{count} nhóm</div>
                  <div>{totalQuestions} câu hỏi</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Quay lại
        </button>
        <button
          onClick={() => {
            console.log('[ImportPreview] ===== SAVE BUTTON CLICKED =====');
            console.log('[ImportPreview] Button state:', {
              isValid: validation.isValid,
              isProcessing: isProcessing,
              disabled: !validation.isValid || isProcessing
            });
            console.log('[ImportPreview] Calling onImport function...');
            onImport();
          }}
          disabled={!validation.isValid || isProcessing}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          {isProcessing ? 'Đang lưu...' : 'Lưu vào Database'}
        </button>
      </div>
    </div>
  );
};

export default ImportPreview;