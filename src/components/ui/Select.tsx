import { forwardRef, SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, hint, options, placeholder, disabled, id, ...props },
    ref
  ) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={clsx(
            'block w-full rounded-lg border shadow-sm appearance-none transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-[#111318]',
            'px-4 py-2.5 pr-10 text-sm',
            error
              ? 'border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 dark:border-[#232834] focus:border-emerald-500 focus:ring-emerald-500/20',
            disabled
              ? 'bg-gray-100 dark:bg-[#0D1117] cursor-not-allowed'
              : 'bg-white dark:bg-card',
            'text-gray-900 dark:text-gray-100',
            'bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")]',
            'bg-[length:1.5rem_1.5rem] bg-no-repeat bg-right',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
