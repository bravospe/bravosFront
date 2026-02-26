'use client';

import { useState, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  fullWidth?: boolean;
  className?: string;
}

const Tabs = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  className,
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const variants = {
    default: {
      container: 'border-b border-gray-200 dark:border-[#1E2230]',
      tab: 'border-b-2 -mb-px',
      active: 'border-emerald-500 text-emerald-600 dark:text-emerald-400',
      inactive:
        'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
    },
    pills: {
      container: 'bg-gray-100 dark:bg-[#0D1117] rounded-xl p-1',
      tab: 'rounded-lg',
      active: 'bg-white dark:bg-emerald-500/15 text-gray-900 dark:text-emerald-400 shadow dark:shadow-none font-medium',
      inactive: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
    },
    underline: {
      container: '',
      tab: 'border-b-2',
      active: 'border-emerald-500 text-emerald-600 dark:text-emerald-400',
      inactive:
        'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400',
    },
  };

  const styles = variants[variant];

  return (
    <div className={className}>
      <div className={clsx('flex', styles.container, fullWidth && 'w-full')}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={clsx(
              'flex items-center justify-center px-4 py-2.5 text-sm font-medium transition-colors',
              styles.tab,
              fullWidth && 'flex-1',
              tab.disabled && 'opacity-50 cursor-not-allowed',
              activeTab === tab.id ? styles.active : styles.inactive
            )}
          >
            {tab.icon && <span className="mr-2 w-5 h-5">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export { Tabs };
