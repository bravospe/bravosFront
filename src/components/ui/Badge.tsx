import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const Badge = ({
  className,
  variant = 'primary',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) => {
  const variants = {
    primary: 'bg-emerald-100 text-blue-800 dark:bg-emerald-500/10 dark:text-emerald-400',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-[#1E2230] dark:text-gray-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400',
    info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-400',
  };

  const dotColors = {
    primary: 'bg-emerald-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-cyan-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};

export { Badge };
