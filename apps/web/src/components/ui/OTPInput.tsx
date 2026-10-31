import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(() => {
    const chars = value.split('').slice(0, length);
    return Array.from({ length }, (_, i) => chars[i] || '');
  });

  useEffect(() => {
    const chars = value.split('').slice(0, length);
    const updated = Array.from({ length }, (_, i) => chars[i] || '');
    setDigits(updated);
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    const fullValue = newDigits.join('');
    onChange(fullValue);

    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (fullValue.length === length && onComplete) {
      onComplete(fullValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!pastedData) return;

    const numericOnly = pastedData.replace(/\D/g, '').slice(0, length);
    if (!numericOnly) return;

    const newDigits = Array.from({ length }, (_, i) => numericOnly[i] || '');
    setDigits(newDigits);

    const fullValue = newDigits.join('');
    onChange(fullValue);

    const nextIndex = Math.min(numericOnly.length, length - 1);
    inputsRef.current[nextIndex]?.focus();

    if (numericOnly.length === length && onComplete) {
      onComplete(numericOnly);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of verification code`}
          className={clsx(
            'w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border bg-navy-800/90 text-slate-100 transition-all duration-200 outline-none',
            hasError
              ? 'border-rose-500 text-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30'
              : digits[index]
              ? 'border-cyber-400/80 bg-cyber-500/5 text-cyber-300 shadow-cyber-sm'
              : 'border-slate-700 hover:border-slate-600 focus:border-cyber-400 focus:ring-2 focus:ring-cyber-400/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      ))}
    </div>
  );
};

export default OTPInput;
