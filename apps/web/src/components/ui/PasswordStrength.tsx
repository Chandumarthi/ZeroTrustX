import React, { useMemo } from 'react';
import clsx from 'clsx';
import { Check, X } from 'lucide-react';

export interface PasswordStrengthProps {
  password: string;
  showRules?: boolean;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showRules = false,
}) => {
  const analysis = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    let score = 0;
    if (hasMinLength) score++;
    if (hasUpper && hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    // Extra length bonus
    if (password.length >= 12 && score === 4) score = 4;

    const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = [
      'bg-slate-700',
      'bg-rose-500',
      'bg-amber-500',
      'bg-sky-400',
      'bg-emerald-400',
    ];

    return {
      score,
      label: password ? labels[score] : 'Enter password',
      color: colors[score],
      rules: [
        { label: 'At least 8 characters', valid: hasMinLength },
        { label: 'Uppercase & lowercase letters', valid: hasUpper && hasLower },
        { label: 'At least one number', valid: hasNumber },
        { label: 'At least one special character', valid: hasSpecial },
      ],
    };
  }, [password]);

  if (!password && !showRules) return null;

  return (
    <div className="w-full space-y-2 mt-2">
      {/* 4 segments */}
      <div className="flex items-center gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((seg) => {
          const isFilled = analysis.score >= seg;
          return (
            <div
              key={seg}
              className={clsx(
                'h-full flex-1 rounded-full transition-all duration-300',
                isFilled ? analysis.color : 'bg-slate-700/60'
              )}
            />
          );
        })}
      </div>

      {password && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Password strength:</span>
          <span
            className={clsx(
              'font-semibold',
              analysis.score <= 1 && 'text-rose-400',
              analysis.score === 2 && 'text-amber-400',
              analysis.score === 3 && 'text-sky-400',
              analysis.score >= 4 && 'text-emerald-400'
            )}
          >
            {analysis.label}
          </span>
        </div>
      )}

      {showRules && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
          {analysis.rules.map((r, i) => (
            <div
              key={i}
              className={clsx(
                'flex items-center gap-1.5 transition-colors',
                r.valid ? 'text-emerald-400' : 'text-slate-400'
              )}
            >
              {r.valid ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
              )}
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;
