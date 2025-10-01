'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
  type: 'preset' | 'custom';
}

interface DateRangePickerProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  compact?: boolean;
}

// Функция для создания локальной даты в формате YYYY-MM-DD
const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Функция для создания даты без учета часового пояса
const createLocalDate = (year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0, ms = 0) => {
  return new Date(year, month, day, hours, minutes, seconds, ms);
};

const presetRanges = [
  {
    key: 'today',
    label: 'Сегодня',
    getValue: () => {
      const today = new Date();
      const startDate = createLocalDate(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const endDate = createLocalDate(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      return { startDate, endDate };
    }
  },
  {
    key: 'yesterday',
    label: 'Вчера',
    getValue: () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const startDate = createLocalDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const endDate = createLocalDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      return { startDate, endDate };
    }
  },
  {
    key: 'week',
    label: 'Последняя неделя',
    getValue: () => {
      const today = new Date();
      const currentDay = today.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // Если воскресенье, то 6 дней назад был понедельник
      
      const mondayDate = new Date(today);
      mondayDate.setDate(today.getDate() - daysToMonday);
      
      const sundayDate = new Date(mondayDate);
      sundayDate.setDate(mondayDate.getDate() + 6);
      
      const startDate = createLocalDate(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate(), 0, 0, 0, 0);
      const endDate = createLocalDate(sundayDate.getFullYear(), sundayDate.getMonth(), sundayDate.getDate(), 23, 59, 59, 999);
      
      return { startDate, endDate };
    }
  },
  {
    key: 'month',
    label: 'Последний месяц',
    getValue: () => {
      const today = new Date();
      const startDate = createLocalDate(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
      
      // Последний день месяца
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const endDate = createLocalDate(today.getFullYear(), today.getMonth(), lastDay, 23, 59, 59, 999);
      
      return { startDate, endDate };
    }
  },
  {
    key: 'year',
    label: 'Последний год',
    getValue: () => {
      const today = new Date();
      const startDate = createLocalDate(today.getFullYear(), 0, 1, 0, 0, 0, 0);
      const endDate = createLocalDate(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      
      return { startDate, endDate };
    }
  }
];

export default function DateRangePicker({ selectedRange, onRangeChange, compact = false }: DateRangePickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    const { startDate, endDate } = preset.getValue();
    onRangeChange({
      startDate,
      endDate,
      label: preset.label,
      type: 'preset'
    });
    setShowCustomPicker(false);
  };

  const handleCustomRangeApply = () => {
    if (!customStartDate || !customEndDate) return;
    
    // Создаем даты и устанавливаем правильное время
    const startDate = new Date(customStartDate + 'T00:00:00');
    const endDate = new Date(customEndDate + 'T23:59:59.999');
    
    if (startDate > endDate) {
      alert('Дата начала не может быть позже даты окончания');
      return;
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    onRangeChange({
      startDate,
      endDate,
      label: `${formatDate(startDate)} - ${formatDate(endDate)}`,
      type: 'custom'
    });
    setShowCustomPicker(false);
  };

  const isPresetSelected = (preset: typeof presetRanges[0]) => {
    return selectedRange.type === 'preset' && selectedRange.label === preset.label;
  };

  if (compact) {
    return (
      <div className="bg-gray-700/30 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30">
        <div className="flex items-center space-x-3 mb-3">
          <CalendarIcon className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Период анализа</span>
        </div>

        {/* Compact Preset Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {presetRanges.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handlePresetClick(preset)}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                ${isPresetSelected(preset)
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'bg-gray-600/50 text-gray-300 hover:bg-gray-500/50 hover:text-white'
                }
              `}
            >
              {preset.label}
            </button>
          ))}
          
          {/* Compact Custom Range Button */}
          <button
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1
              ${selectedRange.type === 'custom'
                ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md'
                : 'bg-gray-600/50 text-gray-300 hover:bg-gray-500/50 hover:text-white'
              }
            `}
          >
            <span>Свой период</span>
            <ChevronDownIcon 
              className={`h-3 w-3 transition-transform duration-200 ${showCustomPicker ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>

        {/* Compact Custom Date Picker */}
        {showCustomPicker && (
          <div className="bg-gray-800/40 rounded-md p-3 border border-gray-600/20 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  От
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  До
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCustomPicker(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCustomRangeApply}
                disabled={!customStartDate || !customEndDate}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Применить
              </button>
            </div>
          </div>
        )}

        {/* Compact Selected Range Display */}
        <div className="text-xs text-gray-400 flex items-center justify-between">
          <span>Период:</span>
          <span className="text-white font-medium bg-gray-600/20 px-2 py-1 rounded">
            {selectedRange.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Период анализа</h3>
        </div>
        <div className="text-sm text-gray-400">
          Выберите период для отображения статистики
        </div>
      </div>

      {/* Preset Tags */}
      <div className="flex flex-wrap gap-3 mb-4">
        {presetRanges.map((preset) => (
          <button
            key={preset.key}
            onClick={() => handlePresetClick(preset)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105
              ${isPresetSelected(preset)
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/50'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
        
        {/* Custom Range Button */}
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 flex items-center space-x-2
            ${selectedRange.type === 'custom'
              ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg shadow-green-500/25'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/50'
            }
          `}
        >
          <span>Свой период</span>
          <ChevronDownIcon 
            className={`h-4 w-4 transition-transform duration-200 ${showCustomPicker ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>

      {/* Custom Date Picker */}
      {showCustomPicker && (
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Дата начала
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Дата окончания
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCustomPicker(false)}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleCustomRangeApply}
              disabled={!customStartDate || !customEndDate}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              Применить
            </button>
          </div>
        </div>
      )}

      {/* Selected Range Display */}
      <div className="mt-4 p-3 bg-gray-700/20 rounded-lg border border-gray-600/20">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Выбранный период:
          </div>
          <div className="text-sm font-medium text-white bg-gray-600/30 px-3 py-1 rounded-full">
            {selectedRange.label}
          </div>
        </div>
      </div>
    </div>
  );
}
