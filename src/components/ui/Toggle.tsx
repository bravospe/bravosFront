'use client';

import React from 'react';
import clsx from 'clsx';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    className?: string;
}

const Toggle = ({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    label,
    className,
}: ToggleProps) => {
    const sizes = {
        sm: {
            track: 'w-8 h-[18px]',
            thumb: 'w-3.5 h-3.5',
            translate: 'translate-x-[14px]',
        },
        md: {
            track: 'w-10 h-[22px]',
            thumb: 'w-[18px] h-[18px]',
            translate: 'translate-x-[18px]',
        },
        lg: {
            track: 'w-12 h-[26px]',
            thumb: 'w-[22px] h-[22px]',
            translate: 'translate-x-[22px]',
        },
    };

    const s = sizes[size];

    return (
        <label
            className={clsx(
                'inline-flex items-center gap-2 select-none',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                className
            )}
        >
            <button
                role="switch"
                type="button"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={clsx(
                    'relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#111318]',
                    s.track,
                    checked
                        ? 'bg-emerald-500 focus:ring-emerald-500/40'
                        : 'bg-gray-300 dark:bg-[#2A3040] focus:ring-gray-400/40'
                )}
            >
                <span
                    className={clsx(
                        'inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ml-[2px]',
                        s.thumb,
                        checked ? s.translate : 'translate-x-0'
                    )}
                />
            </button>
            {label && (
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    {label}
                </span>
            )}
        </label>
    );
};

export { Toggle };
