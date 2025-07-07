import { ReactNode } from 'react';
import classNames from 'classnames';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  elevation?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '', 
  elevation = 'sm' 
}) => {
  const shadowClass = {
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg'
  }[elevation];
  
  return (
    <div className={classNames(
      'bg-gray-700 rounded-lg overflow-hidden', 
      shadowClass,
      className
    )}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-600">
          <h3 className="text-lg font-medium text-gray-50">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};