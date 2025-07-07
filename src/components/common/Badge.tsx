import { ReactNode } from 'react';
import classNames from 'classnames';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  className?: string;
}

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  className,
}: BadgeProps) => {
  const variantClasses = {
    default: 'bg-gray-700 text-gray-50',
    primary: 'bg-primary-200 text-gray-800',
    secondary: 'bg-secondary-200 text-gray-800',
    success: 'bg-success-200 text-gray-800',
    warning: 'bg-warning-200 text-gray-800',
    error: 'bg-error-200 text-gray-800',
    info: 'bg-info-200 text-gray-800',
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };
  
  return (
    <span
      className={classNames(
        'inline-flex items-center font-medium',
        variantClasses[variant],
        sizeClasses[size],
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
    >
      {children}
    </span>
  );
};

// Sử dụng cho level
export const LevelBadge: React.FC<{ level: number }> = ({ level }) => {
  const getVariant = () => {
    if (level === 0) return 'default';
    if (level >= 1 && level <= 3) return 'info';
    if (level >= 4 && level <= 7) return 'secondary';
    return 'success';
  };
  
  const getLabel = () => {
    if (level === 0) return 'Mới';
    if (level >= 1 && level <= 3) return 'Đang học';
    if (level >= 4 && level <= 7) return 'Cơ bản';
    return 'Thành thạo';
  };
  
  return (
    <Badge variant={getVariant()} rounded>
      {getLabel()} • Cấp {level}
    </Badge>
  );
}; 