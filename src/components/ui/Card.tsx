import { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> { }

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
}

const Card = ({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: CardProps) => {
  const variants = {
    default: 'bg-card border border-gray-200 dark:border-[#1E2230]',
    bordered: 'bg-card border-2 border-gray-300 dark:border-[#232834]',
    elevated: 'bg-card shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  };

  return (
    <div
      className={clsx('rounded-xl', variants[variant], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({
  className,
  title,
  subtitle,
  action,
  children,
  ...props
}: CardHeaderProps) => {
  return (
    <div
      className={clsx(
        'flex items-start justify-between pb-4 border-b border-gray-200 dark:border-[#1E2230] mb-4',
        className
      )}
      {...props}
    >
      {(title || subtitle) && (
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      )}
      {children}
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
};

const CardBody = ({ className, children, ...props }: CardBodyProps) => {
  return (
    <div className={clsx('', className)} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({
  className,
  align = 'right',
  children,
  ...props
}: CardFooterProps) => {
  const alignments = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={clsx(
        'flex items-center pt-4 border-t border-gray-200 dark:border-[#1E2230] mt-4',
        alignments[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { Card };
