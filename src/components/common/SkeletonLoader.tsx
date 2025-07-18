import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animate?: boolean;
}

/**
 * Component Skeleton cơ bản
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = 'md',
  animate = true
}) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={`bg-gray-300 ${roundedClasses[rounded]} ${animate ? 'animate-pulse' : ''} ${className}`}
      style={{ width, height }}
    />
  );
};

/**
 * Skeleton cho Vocab Card
 */
export const VocabCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 animate-pulse border border-gray-100 ${className}`}>
    {/* Header skeleton */}
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <Skeleton height="2rem" width="75%" className="mb-2" />
        <Skeleton height="1rem" width="50%" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton width="3rem" height="1.5rem" rounded="full" />
        <Skeleton width="4rem" height="1.5rem" rounded="full" />
      </div>
    </div>
    
    {/* Meaning skeleton */}
    <div className="mb-4">
      <Skeleton height="1.25rem" width="66%" className="mb-2" />
    </div>
    
    {/* Example skeleton */}
    <div className="mb-4 bg-gray-50 rounded-lg p-4">
      <Skeleton height="1rem" width="100%" className="mb-1" />
      <Skeleton height="1rem" width="80%" className="mb-2" />
      <Skeleton height="0.875rem" width="40%" />
    </div>
    
    {/* Synonyms skeleton */}
    <div>
      <Skeleton height="0.875rem" width="30%" className="mb-2" />
      <div className="flex gap-2">
        <Skeleton width="4rem" height="1.5rem" rounded="full" />
        <Skeleton width="5rem" height="1.5rem" rounded="full" />
        <Skeleton width="4.5rem" height="1.5rem" rounded="full" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton cho Product Card
 */
export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}>
    <Skeleton width="100%" height="12rem" className="mb-4" rounded="lg" />
    <Skeleton height="1.5rem" className="mb-2" />
    <Skeleton height="1rem" width="75%" className="mb-2" />
    <Skeleton height="1.25rem" width="50%" />
  </div>
);

/**
 * Skeleton cho List Item
 */
export const ListItemSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center space-x-4 p-4 ${className}`}>
    <Skeleton width="3rem" height="3rem" rounded="full" />
    <div className="flex-1">
      <Skeleton height="1rem" width="60%" className="mb-2" />
      <Skeleton height="0.875rem" width="40%" />
    </div>
    <Skeleton width="5rem" height="2rem" rounded="md" />
  </div>
);

/**
 * Skeleton cho Table Row
 */
export const TableRowSkeleton: React.FC<{ columns: number; className?: string }> = ({ 
  columns, 
  className = '' 
}) => (
  <tr className={className}>
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <Skeleton height="1rem" width={index === 0 ? '80%' : '60%'} />
      </td>
    ))}
  </tr>
);

/**
 * Skeleton cho Text Block
 */
export const TextBlockSkeleton: React.FC<{ 
  lines?: number; 
  className?: string;
}> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton 
        key={index}
        height="1rem" 
        width={index === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

/**
 * Skeleton cho Avatar với Text
 */
export const AvatarTextSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center space-x-3 ${className}`}>
    <Skeleton width="2.5rem" height="2.5rem" rounded="full" />
    <div>
      <Skeleton height="1rem" width="8rem" className="mb-1" />
      <Skeleton height="0.875rem" width="6rem" />
    </div>
  </div>
);

/**
 * Skeleton cho Button
 */
export const ButtonSkeleton: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32'
  };

  return (
    <Skeleton 
      className={`${sizeClasses[size]} ${className}`}
      rounded="md"
    />
  );
};

/**
 * Skeleton cho Card Header
 */
export const CardHeaderSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex justify-between items-center ${className}`}>
    <div>
      <Skeleton height="1.5rem" width="12rem" className="mb-2" />
      <Skeleton height="1rem" width="8rem" />
    </div>
    <Skeleton width="6rem" height="2.5rem" rounded="md" />
  </div>
);

/**
 * Skeleton cho Stats Card
 */
export const StatsCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg p-6 shadow-sm ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <Skeleton height="0.875rem" width="6rem" className="mb-2" />
        <Skeleton height="2rem" width="4rem" />
      </div>
      <Skeleton width="3rem" height="3rem" rounded="lg" />
    </div>
  </div>
);

/**
 * Skeleton Grid Container
 */
export const SkeletonGrid: React.FC<{
  count: number;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}> = ({ count, columns = 3, children, className = '' }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`}>
          {children}
        </div>
      ))}
    </div>
  );
};

/**
 * Higher Order Component để wrap component với skeleton loading
 */
export function withSkeleton<T extends object>(
  Component: React.ComponentType<T>,
  SkeletonComponent: React.ComponentType<any>,
  loadingProp: keyof T = 'loading' as keyof T
) {
  return function SkeletonWrapper(props: T) {
    const isLoading = props[loadingProp];
    
    if (isLoading) {
      return <SkeletonComponent />;
    }
    
    return <Component {...props} />;
  };
}

/**
 * Hook để tạo skeleton array với animation delay
 */
export function useSkeletonArray(count: number, delayMs: number = 100) {
  return Array.from({ length: count }).map((_, index) => ({
    key: `skeleton-${index}`,
    delay: index * delayMs
  }));
}