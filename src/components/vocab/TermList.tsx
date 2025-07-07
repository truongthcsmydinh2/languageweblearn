// src/components/vocab/TermList.tsx
import React, { useState } from 'react';
import { useVocab } from '../../hooks/useVocab';
import { Term } from '../../services/firebase/database';

interface TermListProps {
  setId: string;
  terms: Record<string, Term>;
}

const TermList: React.FC<TermListProps> = ({ setId, terms }) => {
  const { deleteTerm } = useVocab();
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const toggleTerm = (termId: string) => {
    setExpandedTerms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(termId)) {
        newSet.delete(termId);
      } else {
        newSet.add(termId);
      }
      return newSet;
    });
  };

  const handleDeleteTerm = async (termId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa từ vựng này?')) {
      await deleteTerm(setId, termId);
    }
  };

  if (!terms || Object.keys(terms).length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Chưa có từ vựng nào trong bộ này</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {Object.entries(terms).map(([termId, term]) => {
          const isExpanded = expandedTerms.has(termId);
          const memoryStrength = term.memoryStrength || 0;
          
          return (
            <li key={termId} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div 
                  className="flex-grow cursor-pointer" 
                  onClick={() => toggleTerm(termId)}
                >
                  <div className="flex items-center">
                    <div className="flex-grow">
                      <p className="font-medium text-gray-900">{term.vocab}</p>
                      <p className="text-gray-500">{term.meaning}</p>
                    </div>
                    <MemoryStrengthBadge strength={memoryStrength} />
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Độ mạnh ghi nhớ: {memoryStrength}/5</p>
                      {term.lastReviewed && (
                        <p>Lần ôn tập cuối: {new Date(term.lastReviewed).toLocaleDateString('vi-VN')}</p>
                      )}
                      {term.nextReviewDate && (
                        <p>Lần ôn tập tiếp theo: {new Date(term.nextReviewDate).toLocaleDateString('vi-VN')}</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex-shrink-0 flex space-x-2">
                  <button
                    onClick={() => handleDeleteTerm(termId)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

interface BadgeProps {
  strength: number;
}

const MemoryStrengthBadge: React.FC<BadgeProps> = ({ strength }) => {
  const colors = [
    'bg-red-100 text-red-800',     // 0
    'bg-orange-100 text-orange-800', // 1
    'bg-yellow-100 text-yellow-800', // 2
    'bg-blue-100 text-blue-800',   // 3
    'bg-green-100 text-green-800', // 4
    'bg-emerald-100 text-emerald-800' // 5
  ];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[strength]}`}>
      {strength === 0 ? 'Mới' : `Cấp ${strength}`}
    </span>
  );
};

export default TermList;