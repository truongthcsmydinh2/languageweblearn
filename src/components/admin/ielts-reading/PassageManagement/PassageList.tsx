import React from 'react';
import { Passage, PassageListProps } from '@/types/ielts-reading';
import { formatDate, truncateText, getLevelClass } from '@/utils/ielts-reading/helpers';
import { Eye, Edit, Copy, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const PassageList: React.FC<PassageListProps> = ({
  passages,
  selectedPassage,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading passages...</span>
      </div>
    );
  }

  if (passages.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <Eye className="mx-auto h-12 w-12 mb-2" />
          <p className="text-lg font-medium">No passages found</p>
          <p className="text-sm">Create your first IELTS Reading passage to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {passages.map((passage) => (
        <div
          key={passage.id}
          className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
            selectedPassage?.id === passage.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect(passage)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {passage.title}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    getLevelClass(passage.level)
                  }`}
                >
                  {passage.level}
                </span>
                <div className="flex items-center">
                  {passage.is_active ? (
                    <ToggleRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={`ml-1 text-xs ${
                    passage.is_active ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {passage.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3">
                {truncateText(passage.content, 150)}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Genre: {passage.genre || 'General'}</span>
                <span>Time: {passage.time_limit || 20} min</span>
                <span>Questions: {passage.question_count || 0}</span>
                <span>Created: {formatDate(passage.created_at)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(passage);
                }}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit passage"
              >
                <Edit className="h-4 w-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(passage.id);
                }}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Duplicate passage"
              >
                <Copy className="h-4 w-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus(passage.id, !passage.is_active);
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
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
          </div>
        </div>
      ))}
    </div>
  );
};

export default PassageList;