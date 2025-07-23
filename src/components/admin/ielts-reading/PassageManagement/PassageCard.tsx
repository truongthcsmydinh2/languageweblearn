import React from 'react';
import { PassageCardProps } from '@/types/ielts-reading';
import { formatDate, getLevelClass, estimateReadingTime } from '@/utils/ielts-reading/helpers';
import { Clock, BookOpen, Users, Calendar, Tag, ToggleLeft, ToggleRight, Edit, Copy, Trash2 } from 'lucide-react';

const PassageCard: React.FC<PassageCardProps> = ({
  passage,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  showActions = true,
}) => {
  const readingTime = estimateReadingTime(passage.content);
  const wordCount = passage.content.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900 truncate">
                {passage.title}
              </h3>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  getLevelClass(passage.level)
                }`}
              >
                {passage.level}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                {passage.is_active ? (
                  <ToggleRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gray-400 mr-1" />
                )}
                <span className={passage.is_active ? 'text-green-600' : 'text-gray-500'}>
                  {passage.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created {formatDate(passage.created_at)}
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => onEdit(passage)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit passage"
              >
                <Edit className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => onDuplicate(passage.id)}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Duplicate passage"
              >
                <Copy className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => onToggleStatus(passage.id, !passage.is_active)}
                className={`p-2 rounded-lg transition-colors ${
                  passage.is_active
                    ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                }`}
                title={passage.is_active ? 'Deactivate passage' : 'Activate passage'}
              >
                {passage.is_active ? (
                  <ToggleLeft className="h-4 w-4" />
                ) : (
                  <ToggleRight className="h-4 w-4" />
                )}
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this passage? This action cannot be undone.')) {
                    onDelete(passage.id);
                  }
                }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete passage"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-900">{wordCount}</div>
              <div className="text-xs text-gray-500">Words</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-900">{passage.time_limit || 20} min</div>
              <div className="text-xs text-gray-500">Time Limit</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Users className="h-5 w-5 text-purple-500 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-900">{passage.total_questions || 0}</div>
              <div className="text-xs text-gray-500">Questions</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Tag className="h-5 w-5 text-orange-500 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-900">{passage.genre || 'General'}</div>
              <div className="text-xs text-gray-500">Genre</div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          Estimated reading time: {readingTime} minutes
        </div>
      </div>
      
      {/* Content Preview */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Content Preview</h4>
        <div className="prose prose-sm max-w-none">
          <div className="text-gray-700 leading-relaxed">
            {passage.content.length > 500 ? (
              <>
                {passage.content.substring(0, 500)}...
                <button className="text-blue-600 hover:text-blue-800 ml-2 font-medium">
                  Read more
                </button>
              </>
            ) : (
              passage.content
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      {passage.updated_at && passage.updated_at !== passage.created_at && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Last updated: {formatDate(passage.updated_at)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PassageCard;