import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDueTerms } from '../../services/vocabService';
import { Term } from '../../services/firebase/database';
import Link from 'next/link';

const DueTermsList: React.FC = () => {
  const { user } = useAuth();
  const [dueTerms, setDueTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDueTerms() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const terms = await getDueTerms(user.uid);
        setDueTerms(terms.slice(0, 5)); // Lấy 5 từ đầu tiên
      } catch (error) {
        console.error('Error loading due terms:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDueTerms();
  }, [user]);

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded-lg"></div>;
  }

  if (dueTerms.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <p className="text-gray-500 text-center py-4">Không có từ vựng nào đến hạn ôn tập</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <ul className="divide-y divide-gray-200">
        {dueTerms.map((term) => (
          <li key={term.id} className="p-4 hover:bg-indigo-50 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800 hover:text-indigo-700">{term.vocab}</p>
                <p className="text-gray-500 text-sm">{term.meaning}</p>
              </div>
              <MemoryStrengthBadge strength={term.memoryStrength || 0} />
            </div>
          </li>
        ))}
      </ul>
      {dueTerms.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <Link href="/learning" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Bắt đầu ôn tập ngay →
          </Link>
        </div>
      )}
    </div>
  );
};

interface BadgeProps {
  strength: number;
}

const MemoryStrengthBadge: React.FC<BadgeProps> = ({ strength }) => {
  const colors = [
    'bg-rose-100 text-rose-800',      // 0
    'bg-amber-100 text-amber-800',    // 1
    'bg-yellow-100 text-yellow-800',  // 2
    'bg-indigo-100 text-indigo-800',  // 3
    'bg-emerald-100 text-emerald-800',// 4
    'bg-green-100 text-green-800'     // 5
  ];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[strength]}`}>
      {strength === 0 ? 'Mới' : `Cấp ${strength}`}
    </span>
  );
};

export default DueTermsList;
