import React from 'react';
import clsx from 'clsx';
import { RiskLevel } from '../../types';

export interface RiskScoreMeterProps {
  score: number; // 0 - 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showCategory?: boolean;
  className?: string;
}

export const RiskScoreMeter: React.FC<RiskScoreMeterProps> = ({
  score,
  size = 'md',
  showLabel = true,
  showCategory = true,
  className,
}) => {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));

  const getRiskDetails = (val: number): { level: RiskLevel; color: string; stroke: string; label: string } => {
    if (val < 30) {
      return { level: 'LOW', color: 'text-emerald-400', stroke: '#10b981', label: 'Low Risk' };
    }
    if (val < 60) {
      return { level: 'MEDIUM', color: 'text-amber-400', stroke: '#f59e0b', label: 'Medium Risk' };
    }
    if (val < 85) {
      return { level: 'HIGH', color: 'text-orange-400', stroke: '#f97316', label: 'High Risk' };
    }
    return { level: 'CRITICAL', color: 'text-rose-500', stroke: '#ef4444', label: 'Critical Risk' };
  };

  const risk = getRiskDetails(normalizedScore);

  const dimension = {
    sm: { width: 100, height: 100, strokeWidth: 8, fontSize: 'text-lg', labelSize: 'text-[10px]' },
    md: { width: 150, height: 150, strokeWidth: 10, fontSize: 'text-2xl', labelSize: 'text-xs' },
    lg: { width: 200, height: 200, strokeWidth: 14, fontSize: 'text-4xl', labelSize: 'text-sm' },
  }[size];

  const radius = (dimension.width - dimension.strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 270 degree arc for gauge look
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className={clsx('flex flex-col items-center justify-center select-none', className)}>
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={dimension.width}
          height={dimension.height}
          viewBox={`0 0 ${dimension.width} ${dimension.height}`}
          className="-rotate-90 transform"
        >
          {/* Background track */}
          <circle
            cx={dimension.width / 2}
            cy={dimension.height / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={dimension.strokeWidth}
            fill="transparent"
            className="text-slate-800/80"
          />
          {/* Active Progress */}
          <circle
            cx={dimension.width / 2}
            cy={dimension.height / 2}
            r={radius}
            stroke={risk.stroke}
            strokeWidth={dimension.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={clsx('font-bold font-mono tracking-tight text-white', dimension.fontSize)}>
            {normalizedScore}
          </span>
          {showLabel && (
            <span className={clsx('font-medium text-slate-400 uppercase tracking-wider', dimension.labelSize)}>
              Score
            </span>
          )}
        </div>
      </div>

      {showCategory && (
        <div className="mt-2 text-center">
          <span className={clsx('text-xs font-semibold uppercase tracking-wider', risk.color)}>
            {risk.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default RiskScoreMeter;
