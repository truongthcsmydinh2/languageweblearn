import React, { useEffect } from 'react';
import { useVocabContext } from '../contexts/VocabContext';

const VocabList: React.FC = () => {
  const { user, vocabSets, selectedSet } = useVocabContext();

  useEffect(() => {
    console.log('VocabList component mounted');
    
    if (!user) {
      console.log('Không có user trong VocabList');
      return;
    }
    
    // Xác nhận context đang hoạt động
    console.log('Current vocab sets in context:', vocabSets);
    console.log('Current selected set:', selectedSet);
    
    if (selectedSet) {
      // Log khi có set được chọn
      console.log('Set đã chọn:', selectedSet);
      console.log('Terms trong set đã chọn:', selectedSet.terms);
      
      if (selectedSet.terms) {
        console.log('Số lượng terms:', selectedSet.terms.length);
      } else {
        console.log('Không có terms trong set đã chọn');
      }
    }
  }, [user, vocabSets, selectedSet]);

  return (
    <div>VocabList component content</div>
  );
};

export default VocabList; 