import { ButtonHTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  rounded?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  loading = false,
  rounded = false,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const variantClasses = {
    primary: 'bg-primary-200 hover:bg-primary-300 text-gray-800 shadow-sm',
    secondary: 'bg-secondary-200 hover:bg-secondary-300 text-gray-800 shadow-sm',
    tertiary: 'bg-gray-700 hover:bg-gray-600 text-gray-50 shadow-sm',
    outline: 'border border-gray-600 text-gray-50 hover:bg-gray-700',
    ghost: 'text-gray-50 hover:bg-gray-700',
    danger: 'bg-error-200 hover:bg-error-600 text-gray-800 shadow-sm',
  };
  
  const sizeClasses = {
    xs: 'text-xs py-1 px-2',
    sm: 'text-sm py-1.5 px-3',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-2.5 px-5',
  };
  
  return (
    <button
      disabled={disabled || loading}
      className={classNames(
        'font-medium inline-flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-300',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        rounded ? 'rounded-full' : 'rounded-md',
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && (
        <svg 
          className={classNames(
            'animate-spin -ml-1 mr-2 h-4 w-4',
            iconPosition === 'left' ? 'mr-2' : 'order-2 ml-2'
          )} 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {icon && !loading && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && !loading && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
}; 