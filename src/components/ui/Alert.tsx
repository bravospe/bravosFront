import { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
}

const Alert = ({
  className,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon,
  children,
  ...props
}: AlertProps) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200 dark:bg-emerald-500/5 dark:border-emerald-500/20',
      icon: 'text-emerald-500',
      title: 'text-blue-800 dark:text-blue-300',
      text: 'text-blue-700 dark:text-emerald-400',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/20',
      icon: 'text-emerald-500',
      title: 'text-emerald-800 dark:text-emerald-300',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20',
      icon: 'text-amber-500',
      title: 'text-amber-800 dark:text-amber-300',
      text: 'text-amber-700 dark:text-amber-400',
    },
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20',
      icon: 'text-red-500',
      title: 'text-red-800 dark:text-red-300',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  const defaultIcons = {
    info: InformationCircleIcon,
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: XCircleIcon,
  };

  const IconComponent = defaultIcons[variant];
  const styles = variants[variant];

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        styles.container,
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {icon || <IconComponent className={clsx('w-5 h-5', styles.icon)} style={{ width: '20px', height: '20px', flexShrink: 0 }} />}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={clsx('text-sm font-medium', styles.title)}>{title}</h3>
          )}
          {children && (
            <div className={clsx('text-sm', styles.text, title && 'mt-1')}>
              {children}
            </div>
          )}
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onDismiss}
              className={clsx(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                styles.text,
                'hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { Alert };
