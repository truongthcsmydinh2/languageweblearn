import React, { useState, useEffect } from 'react';
import styles from '@/styles/TypingEffect.module.css';

interface TypewriterEffectProps {
  text: string;
  speed?: number; // milliseconds per character
  showCursor?: boolean;
  onComplete?: () => void;
  className?: string;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  text,
  speed = 30,
  showCursor = true,
  onComplete,
  className = ''
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, isComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <span className={`${styles.typingEffect} ${className}`}>
      {displayedText}
      {showCursor && !isComplete && (
        <span className={styles.typingCursor}></span>
      )}
    </span>
  );
};

export default TypewriterEffect;