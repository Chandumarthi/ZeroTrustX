import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'cyber';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  className,
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all duration-200 relative overflow-hidden';

  const variantStyles = {
    default: 'bg-navy-800/60 backdrop-blur-md border border-slate-700/50 shadow-glass',
    elevated: 'bg-navy-750/90 backdrop-blur-lg border border-slate-600/50 shadow-xl',
    outlined: 'bg-transparent border border-slate-750 hover:border-slate-600',
    cyber:
      'bg-navy-800/80 backdrop-blur-md border border-cyber-500/30 shadow-cyber-sm hover:border-cyber-400/60',
  }[variant];

  const interactiveStyles = interactive
    ? 'hover:-translate-y-0.5 hover:shadow-cyber-md cursor-pointer'
    : '';

  return (
    <div className={clsx(baseStyles, variantStyles, interactiveStyles, className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={clsx('px-6 py-5 border-b border-slate-800/80 flex items-center justify-between', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={clsx('text-base font-semibold text-slate-100 tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={clsx('text-xs text-slate-400 mt-1', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={clsx('p-6', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={clsx('px-6 py-4 border-t border-slate-800/80 bg-navy-900/30 flex items-center justify-between', className)} {...props}>
    {children}
  </div>
);

export default Card;
