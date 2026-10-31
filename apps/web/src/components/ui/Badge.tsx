import React from 'react';
import clsx from 'clsx';
import { AccessDecision, RiskLevel, SeverityLevel, UserRole, UserStatus } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'low'
    | 'medium'
    | 'high'
    | 'critical'
    | 'allow'
    | 'step_up'
    | 'restrict'
    | 'block'
    | 'active'
    | 'inactive'
    | 'suspended'
    | 'cyber'
    | 'admin'
    | 'user';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
  ...props
}) => {
  const variantStyles: Record<string, { bg: string; text: string; border: string; dotColor: string }> = {
    default: {
      bg: 'bg-slate-800/80',
      text: 'text-slate-300',
      border: 'border-slate-700',
      dotColor: 'bg-slate-400',
    },
    low: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dotColor: 'bg-emerald-400',
    },
    medium: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dotColor: 'bg-amber-400',
    },
    high: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      dotColor: 'bg-orange-400',
    },
    critical: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/40',
      dotColor: 'bg-rose-500 animate-pulse',
    },
    allow: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dotColor: 'bg-emerald-400',
    },
    step_up: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/30',
      dotColor: 'bg-sky-400',
    },
    restrict: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dotColor: 'bg-amber-400',
    },
    block: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/40',
      dotColor: 'bg-rose-400',
    },
    active: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dotColor: 'bg-emerald-400',
    },
    inactive: {
      bg: 'bg-slate-800/80',
      text: 'text-slate-400',
      border: 'border-slate-700',
      dotColor: 'bg-slate-400',
    },
    suspended: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/40',
      dotColor: 'bg-rose-400',
    },
    cyber: {
      bg: 'bg-cyber-500/10',
      text: 'text-cyber-300',
      border: 'border-cyber-500/30',
      dotColor: 'bg-cyber-400',
    },
    admin: {
      bg: 'bg-violet-500/15',
      text: 'text-violet-300',
      border: 'border-violet-500/30',
      dotColor: 'bg-violet-400',
    },
    user: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      border: 'border-blue-500/30',
      dotColor: 'bg-blue-400',
    },
  };

  const style = variantStyles[variant.toLowerCase()] || variantStyles.default;

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  }[size];

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium uppercase tracking-wider rounded-full border backdrop-blur-xs select-none',
        style.bg,
        style.text,
        style.border,
        sizeStyles,
        className
      )}
      {...props}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', style.dotColor)} />}
      <span>{children}</span>
    </span>
  );
};

export const RiskBadge: React.FC<{ level: RiskLevel; className?: string }> = ({ level, className }) => {
  const variantMap: Record<RiskLevel, BadgeProps['variant']> = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  };
  return (
    <Badge variant={variantMap[level] || 'default'} dot className={className}>
      {level}
    </Badge>
  );
};

export const DecisionBadge: React.FC<{ decision: AccessDecision; className?: string }> = ({
  decision,
  className,
}) => {
  const variantMap: Record<AccessDecision, BadgeProps['variant']> = {
    ALLOW: 'allow',
    STEP_UP: 'step_up',
    RESTRICT: 'restrict',
    BLOCK: 'block',
  };
  return (
    <Badge variant={variantMap[decision] || 'default'} dot className={className}>
      {decision.replace('_', ' ')}
    </Badge>
  );
};

export const StatusBadge: React.FC<{ status: UserStatus; className?: string }> = ({
  status,
  className,
}) => {
  return (
    <Badge variant={status.toLowerCase() as any} dot className={className}>
      {status}
    </Badge>
  );
};

export const RoleBadge: React.FC<{ role: UserRole; className?: string }> = ({ role, className }) => {
  return (
    <Badge variant={role.toLowerCase() as any} className={className}>
      {role}
    </Badge>
  );
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel; className?: string }> = ({
  severity,
  className,
}) => {
  const map: Record<SeverityLevel, BadgeProps['variant']> = {
    INFO: 'cyber',
    WARNING: 'medium',
    ERROR: 'high',
    CRITICAL: 'critical',
  };
  return (
    <Badge variant={map[severity] || 'default'} dot className={className}>
      {severity}
    </Badge>
  );
};

export default Badge;
