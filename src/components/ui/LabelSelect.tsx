import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { clsx } from 'clsx';

interface LabelOption {
    id: string;
    name: string;
    color: string;
}

interface LabelSelectProps {
    labels: LabelOption[];
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    placeholder?: string;
}

export default function LabelSelect({ labels, value, onChange, placeholder = 'Todas las etiquetas' }: LabelSelectProps) {
    const selectedLabel = labels.find(l => l.id === value);

    return (
        <Listbox value={value || ''} onChange={(val) => onChange(val || undefined)}>
            {({ open }) => (
                <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-[#1E2230] py-2.5 pl-3 pr-10 text-left text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm sm:leading-6">
                        <span className="flex items-center">
                            {selectedLabel ? (
                                <>
                                    <span
                                        className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                        style={{ backgroundColor: selectedLabel.color }}
                                    />
                                    <span className="ml-2.5 block truncate">{selectedLabel.name}</span>
                                </>
                            ) : (
                                <span className="block truncate text-gray-500">{placeholder}</span>
                            )}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                    </Listbox.Button>

                    <Transition
                        show={open}
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-card py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none sm:text-sm">
                            {/* All option */}
                            <Listbox.Option
                                value=""
                                className={({ active }) =>
                                    clsx(
                                        active ? 'bg-emerald-50 dark:bg-emerald-500/10' : '',
                                        'relative cursor-pointer select-none py-2.5 pl-3 pr-9 text-gray-900 dark:text-white'
                                    )
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={clsx('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                            {placeholder}
                                        </span>
                                        {selected && (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-emerald-500">
                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </Listbox.Option>

                            {/* Label options */}
                            {labels.map((label) => (
                                <Listbox.Option
                                    key={label.id}
                                    value={label.id}
                                    className={({ active }) =>
                                        clsx(
                                            active ? 'bg-emerald-50 dark:bg-emerald-500/10' : '',
                                            'relative cursor-pointer select-none py-2.5 pl-3 pr-9 text-gray-900 dark:text-white'
                                        )
                                    }
                                >
                                    {({ selected }) => (
                                        <>
                                            <div className="flex items-center">
                                                <span
                                                    className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                                    style={{ backgroundColor: label.color }}
                                                />
                                                <span className={clsx('ml-2.5 block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                                    {label.name}
                                                </span>
                                            </div>
                                            {selected && (
                                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-emerald-500">
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            )}
        </Listbox>
    );
}
