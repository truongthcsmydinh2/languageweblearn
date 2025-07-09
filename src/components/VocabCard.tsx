import React from 'react';
import { 
  formatTimestamp, 
  getReviewStatus, 
  getLevelText, 
  isOverdue 
} from '../utils/dateUtils';

interface VocabCardProps {
  vocab: {
    id: number;
    vocab: string;
    meanings: string[];
    review_time_en: string | null;
    review_time_vi: string | null;
    last_review_en: string | null;
    last_review_vi: string | null;
    level_en: number;
    level_vi: number;
    created_at: string;
  };
}

export const VocabCard: React.FC<VocabCardProps> = ({ vocab }) => {
  const isEnOverdue = isOverdue(vocab.review_time_en);
  const isViOverdue = isOverdue(vocab.review_time_vi);
  
  return (
    <div className="border border-gray-600 rounded-lg p-4 mb-4 shadow-sm bg-gray-700">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-50">{vocab.vocab}</h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-xs rounded ${
            isEnOverdue ? 'bg-error-200 text-gray-800' : 'bg-success-200 text-gray-800'
          }`}>
            {getReviewStatus(vocab.review_time_en, vocab.last_review_en)}
          </span>
          <span className={`px-2 py-1 text-xs rounded ${
            isViOverdue ? 'bg-error-200 text-gray-800' : 'bg-success-200 text-gray-800'
          }`}>
            {getReviewStatus(vocab.review_time_vi, vocab.last_review_vi)}
          </span>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-gray-50">
          <strong>Nghĩa:</strong> {vocab.meanings.join(', ')}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
        <div>
          <p><strong className="text-gray-50">Tiếng Anh:</strong></p>
          <p>Cấp độ: {getLevelText(vocab.level_en)}</p>
          <p>Review: {formatTimestamp(vocab.review_time_en)}</p>
          <p>Lần cuối: {formatTimestamp(vocab.last_review_en)}</p>
        </div>
        
        <div>
          <p><strong className="text-gray-50">Tiếng Việt:</strong></p>
          <p>Cấp độ: {getLevelText(vocab.level_vi)}</p>
          <p>Review: {formatTimestamp(vocab.review_time_vi)}</p>
          <p>Lần cuối: {formatTimestamp(vocab.last_review_vi)}</p>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        Tạo lúc: {new Date(vocab.created_at).toLocaleString('vi-VN')}
      </div>
    </div>
  );
}; 