import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';
import clsx from 'clsx';
import Button from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load content',
  message = 'An unexpected error occurred while communicating with the security service.',
  onRetry,
  isRetrying = false,
  className,
}) => {
  return (
    <div
      role="alert"
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-2xl border border-rose-500/20 bg-rose-950/10 backdrop-blur-sm',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-sm">
        <AlertOctagon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-rose-300">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1.5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={<RotateCw className="w-4 h-4 text-cyber-400" />}
          className="mt-5"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
