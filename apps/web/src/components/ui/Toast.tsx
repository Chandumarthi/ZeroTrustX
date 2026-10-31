import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';
import { ToastItem, ToastType } from '../../context/ToastContext';

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, className }) => {
  const typeStyles: Record<ToastType, string> = {
    success: 'bg-navy-800/95 border-emerald-500/50 text-emerald-400 shadow-emerald-950/40',
    error: 'bg-navy-800/95 border-rose-500/50 text-rose-400 shadow-rose-950/40',
    warning: 'bg-navy-800/95 border-amber-500/50 text-amber-400 shadow-amber-950/40',
    info: 'bg-navy-800/95 border-cyber-500/50 text-cyber-400 shadow-cyan-950/40',
  };

  const IconComponent = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[toast.type];

  return (
    <div
      role="status"
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-glass transition-all duration-300',
        typeStyles[toast.type],
        className
      )}
    >
      <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-sm font-semibold text-slate-100 mb-0.5">{toast.title}</h4>
        )}
        <p className="text-xs text-slate-300 leading-relaxed break-words">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-100 p-1 -mr-1 -mt-1 rounded-md transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
