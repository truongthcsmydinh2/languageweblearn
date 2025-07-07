import React, { useState } from 'react';

interface VocabCheckboxProps {
  word: string;
  initialChecked?: boolean;
  onChange?: (word: string, checked: boolean) => void;
  color?: string;
}

const VocabCheckbox: React.FC<VocabCheckboxProps> = ({
  word,
  initialChecked = false,
  onChange,
  color = 'indigo'
}) => {
  const [checked, setChecked] = useState(initialChecked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setChecked(isChecked);
    if (onChange) {
      onChange(word, isChecked);
    }
  };

  return (
    <div className="flex items-center mb-2">
      <label className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only" // Hide default checkbox
            checked={checked}
            onChange={handleChange}
          />
          <div 
            className={`w-5 h-5 border-2 rounded transition-colors ${
              checked 
                ? `bg-${color}-500 border-${color}-500` 
                : 'bg-white border-gray-300'
            }`}
          >
            {checked && (
              <svg
                className="w-3 h-3 text-white fill-current absolute inset-1"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
              </svg>
            )}
          </div>
        </div>
        <span className={`ml-3 ${checked ? `text-${color}-500 font-medium` : 'text-gray-600'}`}>
          {word}
        </span>
      </label>
    </div>
  );
};

export default VocabCheckbox; 