import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';
import Skeleton from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found',
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  className,
}: TableProps<T>) {
  return (
    <div className={clsx('w-full overflow-x-auto rounded-xl border border-slate-750 bg-navy-800/40 backdrop-blur-md', className)}>
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-navy-850/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-750 tracking-wider">
          <tr>
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={clsx(
                    'px-5 py-3.5 select-none',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer hover:text-cyber-400 transition-colors',
                    col.className
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div
                    className={clsx(
                      'inline-flex items-center gap-1.5',
                      col.align === 'center' && 'justify-center',
                      col.align === 'right' && 'justify-end'
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-500">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-cyber-400" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-cyber-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={`skeleton-${rIdx}`}>
                {columns.map((_, cIdx) => (
                  <td key={`skeleton-${rIdx}-${cIdx}`} className="px-5 py-4">
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-12 text-center text-slate-400 text-sm font-medium"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'transition-colors duration-150',
                  onRowClick
                    ? 'cursor-pointer hover:bg-slate-800/60'
                    : 'hover:bg-slate-800/30'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={`${keyExtractor(row)}-${col.key}`}
                    className={clsx(
                      'px-5 py-4 text-sm',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.className
                    )}
                  >
                    {col.render ? col.render(row, idx) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
