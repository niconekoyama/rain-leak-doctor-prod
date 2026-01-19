import React from 'react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Alert({ type = 'info', children, className = '' }: AlertProps) {
  const styles = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  return (
    <div
      className={`border px-4 py-3 rounded ${styles[type]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}
