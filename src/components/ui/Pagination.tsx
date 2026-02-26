import { clsx } from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisible?: number;
  className?: string;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisible = 5,
  className,
}: PaginationProps) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      className={clsx('flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={clsx(
            'p-2 rounded-lg text-sm font-medium transition-colors',
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed dark:text-gray-600'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#1E2230]'
          )}
        >
          <span className="sr-only">Primera página</span>
          <ChevronLeftIcon className="w-5 h-5" />
          <ChevronLeftIcon className="w-5 h-5 -ml-3" />
        </button>
      )}

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={clsx(
          'p-2 rounded-lg text-sm font-medium transition-colors',
          currentPage === 1
            ? 'text-gray-300 cursor-not-allowed dark:text-gray-600'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#1E2230]'
        )}
      >
        <span className="sr-only">Anterior</span>
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      {getPageNumbers().map((page, index) =>
        typeof page === 'string' ? (
          <span
            key={`ellipsis-${index}`}
            className="px-3 py-2 text-gray-400 dark:text-gray-500"
          >
            {page}
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={clsx(
              'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
              currentPage === page
                ? 'bg-emerald-500 text-black font-semibold'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#1E2230]'
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={clsx(
          'p-2 rounded-lg text-sm font-medium transition-colors',
          currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed dark:text-gray-600'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#1E2230]'
        )}
      >
        <span className="sr-only">Siguiente</span>
        <ChevronRightIcon className="w-5 h-5" />
      </button>

      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={clsx(
            'p-2 rounded-lg text-sm font-medium transition-colors',
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed dark:text-gray-600'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#1E2230]'
          )}
        >
          <span className="sr-only">Última página</span>
          <ChevronRightIcon className="w-5 h-5" />
          <ChevronRightIcon className="w-5 h-5 -ml-3" />
        </button>
      )}
    </nav>
  );
};

export { Pagination };
