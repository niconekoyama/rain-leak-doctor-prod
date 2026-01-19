import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeStyles = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full border-blue-600 border-t-transparent ${sizeStyles[size]} ${className}`}
      role="status"
      aria-label="読み込み中"
    >
      <span className="sr-only">読み込み中...</span>
    </div>
  );
}
