import React, { useState } from 'react';
import VocabCheckbox from './VocabCheckbox';

interface Word {
  id: string;
  text: string;
}

interface VocabListProps {
  words: Word[];
  onSelectionChange?: (selectedWords: string[]) => void;
}

const VocabList: React.FC<VocabListProps> = ({ words, onSelectionChange }) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  const handleCheckboxChange = (word: string, isChecked: boolean) => {
    let newSelectedWords;
    
    if (isChecked) {
      newSelectedWords = [...selectedWords, word];
    } else {
      newSelectedWords = selectedWords.filter(w => w !== word);
    }
    
    setSelectedWords(newSelectedWords);
    
    if (onSelectionChange) {
      onSelectionChange(newSelectedWords);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Danh sách từ vựng</h3>
      <div className="space-y-1">
        {words.map((word) => (
          <VocabCheckbox
            key={word.id}
            word={word.text}
            onChange={handleCheckboxChange}
            color="indigo"
          />
        ))}
      </div>
      
      {selectedWords.length > 0 && (
        <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
          <p className="text-sm text-indigo-700">
            {selectedWords.length} từ đã được chọn
          </p>
        </div>
      )}
    </div>
  );
};

export default VocabList; 