'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  icon,
  disabled = false,
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 h-10 text-left
          bg-gray-700/50 border border-gray-600/50 rounded-lg
          text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500/50 cursor-pointer'}
          ${isOpen ? 'ring-2 ring-indigo-500/50 border-indigo-500/50' : ''}
          ${icon ? 'pl-10' : ''}
        `}
      >
        {/* Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {/* Selected value */}
        <span className={`block truncate ${selectedOption ? 'text-white' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {/* Arrow */}
        <ChevronUpDownIcon 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full bg-gray-800 border border-gray-600/50 rounded-lg shadow-xl max-h-60 overflow-auto scrollbar-thin
          mt-1 lg:mt-1
          -mt-1 sm:-mt-1
          bottom-full lg:bottom-auto lg:top-full
        ">
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              type="button"
              onClick={() => !option.disabled && handleSelect(option.value)}
              disabled={option.disabled}
              className={`
                w-full flex items-center justify-between px-3 py-2 text-left text-sm
                transition-colors duration-150
                ${option.disabled 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white cursor-pointer'
                }
                ${value === option.value ? 'bg-indigo-600/20 text-indigo-300' : ''}
              `}
            >
              <div className="flex items-center space-x-2">
                {option.icon && (
                  <div className="flex-shrink-0">
                    {option.icon}
                  </div>
                )}
                <span className="truncate">{option.label}</span>
              </div>
              
              {value === option.value && (
                <CheckIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

