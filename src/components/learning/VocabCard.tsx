import React, { useState } from 'react';
import { VocabWord } from '@/types/vocab';

interface VocabCardProps {
  word: VocabWord;
  onAnswer: (isCorrect: boolean) => void;
}

const VocabCard: React.FC<VocabCardProps> = ({ word, onAnswer }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleAnswer = (isCorrect: boolean) => {
    onAnswer(isCorrect);
    setIsFlipped(true);
  };

  return (
    <div className={`vocab-card ${isFlipped ? 'flipped' : ''}`}>
      <div className="front">
        {/* Front side content */}
      </div>
      <div className="back">
        {/* Back side content */}
      </div>
    </div>
  );
};

export default VocabCard; 