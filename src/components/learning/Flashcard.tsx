// src/components/learning/Flashcard.tsx
import React, { useState } from 'react';
import { Term } from '../../services/firebase/database';

interface FlashcardProps {
  term: Term;
  onResult: (isCorrect: boolean, responseTime: number) => void;
  onNext: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ term, onResult, onNext }) => {
  const [flipped, setFlipped] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [resultRecorded, setResultRecorded] = useState(false);

  const handleFlip = () => {
    if (!flipped) {
      setFlipped(true);
    }
  };

  const handleResult = (isCorrect: boolean) => {
    if (resultRecorded) return;
    
    const responseTime = Date.now() - startTime;
    onResult(isCorrect, responseTime);
    setResultRecorded(true);
  };

  const handleNext = () => {
    onNext();
    setFlipped(false);
    setStartTime(Date.now());
    setResultRecorded(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <div 
        className={`relative w-full h-64 rounded-xl shadow-md transition-transform duration-500 ${
          flipped ? 'rotate-y-180' : ''
        }`}
        style={{ perspective: '1000px' }}
      >
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-gray-200 cursor-pointer ${
            flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          } transition-opacity duration-500`}
          onClick={handleFlip}
        >
          <h3 className="text-xl font-bold mb-2">{term.vocab}</h3>
          <p className="text-sm text-gray-500 mb-4">Nhấp để xem nghĩa</p>
          {term.memoryStrength !== undefined && (
            <div className="absolute bottom-4 right-4">
              <MemoryStrengthBadge strength={term.memoryStrength} />
            </div>
          )}
        </div>
        
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-gray-200 ${
            flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } transition-opacity duration-500`}
        >
          <h3 className="text-xl font-bold mb-4">{term.meaning}</h3>
          
          {!resultRecorded ? (
            <div className="flex space-x-4 mt-4">
              <button
                onClick={() => handleResult(false)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Chưa nhớ
              </button>
              <button
                onClick={() => handleResult(true)}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
              >
                Đã nhớ
              </button>
            </div>
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tiếp theo
            </button>
          )}
        </div>
      </div>
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

export default Flashcard;