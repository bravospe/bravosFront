import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftAddon?: string;
  rightAddon?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative flex">
          {leftAddon && (
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:bg-[#1E2230] dark:border-[#232834] dark:text-gray-400">
              {leftAddon}
            </span>
          )}

          <div className="relative flex-1">
            {leftIcon && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 w-5 h-5">{leftIcon}</span>
              </div>
            )}

            <input
              ref={ref}
              id={inputId}
              type={type}
              disabled={disabled}
              className={clsx(
                'block w-full rounded-lg border shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-[#111318]',
                'px-4 py-2.5 text-sm',
                error
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-gray-300 dark:border-[#232834] focus:border-emerald-500 focus:ring-emerald-500/20',
                disabled
                  ? 'bg-gray-100 dark:bg-[#0D1117] cursor-not-allowed'
                  : 'bg-white dark:bg-card dark:text-gray-100',
                'text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600',
                leftAddon && 'rounded-l-none',
                rightAddon && 'rounded-r-none',
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                className
              )}
              {...props}
            />

            {rightIcon && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400 w-5 h-5">{rightIcon}</span>
              </div>
            )}
          </div>

          {rightAddon && (
            <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:bg-[#1E2230] dark:border-[#232834] dark:text-gray-400">
              {rightAddon}
            </span>
          )}
        </div>

        {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
