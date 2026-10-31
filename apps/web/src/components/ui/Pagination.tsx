import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { UsePaginationReturn } from '../../hooks/usePagination';

export interface PaginationProps {
  pagination: UsePaginationReturn;
  totalItems: number;
  showLimitSelector?: boolean;
  limits?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  totalItems,
  showLimitSelector = true,
  limits = [10, 25, 50],
  className,
}) => {
  const {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    canNextPage,
    canPrevPage,
    pages,
    startIndex,
    endIndex,
  } = pagination;

  if (totalItems === 0) return null;

  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-xs text-slate-400 select-none',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span>
          Showing{' '}
          <strong className="text-slate-200">{Math.min(startIndex + 1, totalItems)}</strong> to{' '}
          <strong className="text-slate-200">{endIndex}</strong> of{' '}
          <strong className="text-slate-200">{totalItems}</strong> entries
        </span>

        {showLimitSelector && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-navy-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-cyber-400"
            >
              {limits.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={prevPage}
          disabled={!canPrevPage}
          className="p-1.5 rounded-lg border border-slate-750 bg-navy-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, idx) => {
          if (typeof p === 'string') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-600">
                ...
              </span>
            );
          }

          const isCurrent = p === page;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={clsx(
                'min-w-8 h-8 px-2 text-xs font-medium rounded-lg border transition-all duration-150',
                isCurrent
                  ? 'bg-cyber-500/20 border-cyber-400 text-cyber-300 font-bold shadow-cyber-sm'
                  : 'bg-navy-800/60 border-slate-750 hover:bg-slate-700/60 text-slate-300'
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={nextPage}
          disabled={!canNextPage}
          className="p-1.5 rounded-lg border border-slate-750 bg-navy-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
