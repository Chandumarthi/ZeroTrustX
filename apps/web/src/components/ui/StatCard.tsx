import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import clsx from 'clsx';
import Card from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  description?: string;
  variant?: 'default' | 'cyber' | 'warning' | 'danger';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
  variant = 'default',
  className,
}) => {
  const iconBorderStyles = {
    default: 'text-cyber-400 bg-cyber-500/10 border-cyber-500/20',
    cyber: 'text-cyber-300 bg-cyber-500/15 border-cyber-400/40 shadow-cyber-sm',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    danger: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  }[variant];

  return (
    <Card className={clsx('p-5 transition-all duration-300 hover:border-slate-600', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="text-2xl font-bold tracking-tight text-slate-100 font-mono mt-1">
            {value}
          </div>
        </div>
        <div className={clsx('p-2.5 rounded-xl border flex items-center justify-center', iconBorderStyles)}>
          {icon}
        </div>
      </div>

      {(trend || description) && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {trend && (
            <div
              className={clsx(
                'flex items-center gap-1 font-medium',
                trend.isNeutral
                  ? 'text-slate-400'
                  : trend.isPositive
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              )}
            >
              {trend.isNeutral ? (
                <Minus className="w-3.5 h-3.5" />
              ) : trend.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>{trend.value}</span>
              {trend.label && <span className="text-slate-400 ml-1">{trend.label}</span>}
            </div>
          )}

          {description && <p className="text-slate-400 text-xs truncate">{description}</p>}
        </div>
      )}
    </Card>
  );
};

export default StatCard;
