import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
  striped = false,
  hoverable = true,
  compact = false,
}: TableProps<T>) {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#1E2230]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#1E2230]">
          <thead className="bg-gray-50 dark:bg-[#0D1117]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                  className={clsx(
                    'font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400',
                    compact ? 'px-4 py-2' : 'px-6 py-3',
                    alignments[column.align || 'left']
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#1E2230]">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={clsx('text-center text-gray-500', compact ? 'py-8' : 'py-12')}
                >
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-8 w-8 text-emerald-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={clsx(
                    'text-center text-gray-500 dark:text-gray-400',
                    compact ? 'py-8' : 'py-12'
                  )}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={clsx(
                    onRowClick && 'cursor-pointer',
                    hoverable && 'hover:bg-gray-50 dark:hover:bg-[#161A22]',
                    striped && 'even:bg-gray-50/50 dark:even:bg-[#0D1117]/50',
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx(
                        'text-sm text-gray-900 dark:text-gray-100',
                        compact ? 'px-4 py-2' : 'px-6 py-4',
                        alignments[column.align || 'left']
                      )}
                    >
                      {column.render
                        ? column.render(item, index)
                        : (item as Record<string, unknown>)[column.key]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { Table };
