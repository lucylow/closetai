import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

/**
 * Skeleton component for loading states
 * Displays a shimmer animation while content is loading
 * 
 * @example
 * ```tsx
 * // Loading card
 * <CardSkeleton />
 * 
 * // Loading text
 * <Skeleton variant="text" className="h-4 w-32" />
 * ```
 */
export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div 
      className={`
        animate-pulse bg-gray-200 
        ${variants[variant]}
        ${className}
      `}
      aria-hidden="true"
    />
  );
}

/**
 * Card skeleton placeholder for loading states
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <Skeleton className="aspect-square w-full" variant="rectangular" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" variant="text" />
        <Skeleton className="h-3 w-1/2" variant="text" />
      </div>
    </div>
  );
}

/**
 * Text skeleton for paragraph loading states
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} 
        />
      ))}
    </div>
  );
}

export default Skeleton;
