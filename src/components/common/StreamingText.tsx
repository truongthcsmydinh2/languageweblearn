import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/TypingEffect.module.css';

interface StreamingTextProps {
  text: string;
  speed?: number; // milliseconds per character
  showCursor?: boolean;
  className?: string;
  enableSmoothing?: boolean; // Enable smooth character-by-character display
  highlightNewWords?: boolean; // Highlight new words as they appear
}

const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  speed = 20,
  showCursor = true,
  className = '',
  enableSmoothing = true,
  highlightNewWords = false
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextRef = useRef('');

  useEffect(() => {
    if (text === displayedText) {
      setIsStreaming(false);
      return;
    }

    if (!enableSmoothing) {
      // Hiển thị ngay lập tức nếu không bật smoothing
      setDisplayedText(text);
      setIsStreaming(false);
      return;
    }

    // Chỉ stream phần text mới được thêm vào
    const newText = text.slice(lastTextRef.current.length);
    if (newText.length === 0) return;

    setIsStreaming(true);
    let currentIndex = displayedText.length;
    
    const streamText = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutRef.current = setTimeout(streamText, speed);
      } else {
        setIsStreaming(false);
        lastTextRef.current = text;
      }
    };

    // Bắt đầu streaming từ vị trí hiện tại
    timeoutRef.current = setTimeout(streamText, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, enableSmoothing]);

  // Reset khi text thay đổi hoàn toàn (ví dụ: câu hỏi mới)
  useEffect(() => {
    if (text.length < displayedText.length) {
      setDisplayedText('');
      lastTextRef.current = '';
    }
  }, [text, displayedText.length]);

  const renderText = () => {
    if (!highlightNewWords) {
      return displayedText;
    }

    // Tách thành các từ và highlight từ mới
    const words = displayedText.split(' ');
    const lastWords = lastTextRef.current.split(' ');
    
    return words.map((word, index) => {
      const isNewWord = index >= lastWords.length;
      return (
        <span 
          key={index} 
          className={isNewWord ? styles.newWord : ''}
        >
          {word}{index < words.length - 1 ? ' ' : ''}
        </span>
      );
    });
  };

  return (
    <span className={`${styles.typingEffect} ${className}`}>
      {renderText()}
      {showCursor && isStreaming && (
        <span className={styles.typingCursor}></span>
      )}
    </span>
  );
};

export default StreamingText;