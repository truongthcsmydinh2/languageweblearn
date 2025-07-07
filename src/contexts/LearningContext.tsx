import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of your learning context
interface LearningContextType {
  // Add your context properties here
  // For example:
  currentSection: number;
  setCurrentSection: (section: number) => void;
  // Other learning-related state and functions
}

// Create the context with a default value
const LearningContext = createContext<LearningContextType | undefined>(undefined);

// Create a provider component
interface LearningProviderProps {
  children: ReactNode;
}

export const LearningProvider: React.FC<LearningProviderProps> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState(1);
  
  // Add other state and functions as needed
  
  // Create the value object to be provided
  const value = {
    currentSection,
    setCurrentSection,
    // Add other values as needed
  };
  
  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
};

// Create a custom hook for using this context
export const useLearning = () => {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}; 