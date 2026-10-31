import React from 'react';
import clsx from 'clsx';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'cyber' | 'white' | 'slate';
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'cyber',
  className,
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  }[size];

  const variantClasses = {
    cyber: 'border-cyber-500/20 border-t-cyber-400',
    white: 'border-white/20 border-t-white',
    slate: 'border-slate-700 border-t-slate-300',
  }[variant];

  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx(
        'inline-block animate-spin rounded-full transition-all',
        sizeClasses,
        variantClasses,
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
