import { useMemo, useState } from 'react';

export interface UsePaginationOptions {
  totalItems: number;
  initialPage?: number;
  initialLimit?: number;
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  totalPages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  pages: (number | string)[];
  startIndex: number;
  endIndex: number;
}

export const usePagination = ({
  totalItems,
  initialPage = 1,
  initialLimit = 10,
}: UsePaginationOptions): UsePaginationReturn => {
  const [page, setPageState] = useState<number>(initialPage);
  const [limit, setLimitState] = useState<number>(initialLimit);

  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  const setPage = (newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    setPageState(clamped);
  };

  const setLimit = (newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1);
  };

  const nextPage = () => {
    if (page < totalPages) {
      setPageState((p) => p + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPageState((p) => p - 1);
    }
  };

  const canNextPage = page < totalPages;
  const canPrevPage = page > 1;

  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalItems);

  const pages = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      range.unshift(-1); // represents ellipsis
    }
    if (page + delta < totalPages - 1) {
      range.push(-2); // represents ellipsis
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range.map((p) => (p < 0 ? '...' : p));
  }, [page, totalPages]);

  return {
    page,
    limit,
    totalPages,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    canNextPage,
    canPrevPage,
    pages,
    startIndex,
    endIndex,
  };
};

export default usePagination;
