import React from 'react';
import { Database } from 'lucide-react';
import clsx from 'clsx';
import Button, { ButtonProps } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionVariant?: ButtonProps['variant'];
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionVariant = 'primary',
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-slate-800 bg-navy-850/40 backdrop-blur-sm',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        {icon || <Database className="w-7 h-7 text-cyber-400" />}
      </div>
      <h4 className="text-base font-semibold text-slate-200">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button
          variant={actionVariant}
          size="sm"
          onClick={onAction}
          className="mt-5"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
