import React, { useState, useEffect } from 'react';

interface CustomCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ id, label, checked, onChange }) => {
  // Force component to be fully controlled
  const handleChange = () => {
    onChange(!checked);
  };

  return (
    <div className="flex items-center mb-3 select-none">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="hidden" // Hide original checkbox
      />
      <label htmlFor={id} className="flex items-center cursor-pointer">
        {/* Custom checkbox visual */}
        <div className={`
          w-5 h-5 flex items-center justify-center rounded 
          border transition-all duration-200 ease-in-out
          ${checked 
            ? 'bg-indigo-600 border-indigo-600' 
            : 'bg-white border-gray-300 hover:border-indigo-400'
          }
        `}>
          {checked && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path 
                d="M3.5 6L5.5 8L8.5 4" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        
        {/* Label */}
        <span className={`ml-3 text-base ${checked ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}>
          {label}
        </span>
      </label>
    </div>
  );
};

export default CustomCheckbox; 