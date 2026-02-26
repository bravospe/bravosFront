import { Fragment, ReactNode } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { clsx } from 'clsx';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: 'auto' | 'sm' | 'md' | 'lg';
  className?: string;
}

const Dropdown = ({
  trigger,
  items,
  align = 'right',
  width = 'auto',
  className,
}: DropdownProps) => {
  const widths = {
    auto: 'w-auto min-w-[12rem]',
    sm: 'w-40',
    md: 'w-48',
    lg: 'w-56',
  };

  return (
    <Menu as="div" className={clsx('relative inline-block text-left', className)}>
      <Menu.Button as={Fragment}>{trigger}</Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={clsx(
            'absolute z-50 mt-2 rounded-xl bg-white dark:bg-card shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-none py-1 border border-transparent dark:border-[#232834]',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            widths[width]
          )}
        >
          {items.map((item, index) =>
            item.divider ? (
              <div
                key={index}
                className="my-1 h-px bg-gray-200 dark:bg-[#232834]"
              />
            ) : (
              <Menu.Item key={index} disabled={item.disabled}>
                {({ active }) => {
                  const Component = item.href ? 'a' : 'button';
                  return (
                    <Component
                      href={item.href}
                      onClick={item.onClick}
                      disabled={item.disabled}
                      className={clsx(
                        'flex w-full items-center px-4 py-2 text-sm',
                        active && 'bg-gray-100 dark:bg-[#1E2230]',
                        item.disabled && 'opacity-50 cursor-not-allowed',
                        item.danger
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-700 dark:text-gray-200'
                      )}
                    >
                      {item.icon && (
                        <span className="mr-3 w-5 h-5">{item.icon}</span>
                      )}
                      {item.label}
                    </Component>
                  );
                }}
              </Menu.Item>
            )
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export { Dropdown };
