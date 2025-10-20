'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon, CalendarDaysIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

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

export default function DateRangePicker({ selectedRange, onRangeChange, compact = false }: DateRangePickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  // Состояния для фильтров (как на странице статистики)
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [timeFromFilter, setTimeFromFilter] = useState<string>('00:00');
  const [timeToFilter, setTimeToFilter] = useState<string>('23:59');
  
  // Состояния для редактирования дат
  const [isEditingDateFrom, setIsEditingDateFrom] = useState(false);
  const [isEditingDateTo, setIsEditingDateTo] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');

  // Функции для работы с датами (точно как на странице статистики)
  const formatDateInput = (input: string, previousValue: string = '') => {
    const digits = input.replace(/\D/g, '');
    const previousDigits = previousValue.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 8);
    const isDeleting = limitedDigits.length < previousDigits.length;
    
    if (limitedDigits.length < 2) {
      return limitedDigits;
    } else if (limitedDigits.length === 2) {
      return isDeleting ? limitedDigits : `${limitedDigits}.`;
    } else if (limitedDigits.length < 4) {
      return isDeleting ? limitedDigits : `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2)}`;
    } else if (limitedDigits.length === 4) {
      return isDeleting ? limitedDigits : `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2)}.`;
    } else {
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2, 4)}.${limitedDigits.slice(4)}`;
    }
  };

  const validateDateInput = (dateString: string) => {
    if (!dateString) return { isValid: true, error: '' };
    
    if (!dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      return { isValid: false, error: 'Неверный формат. Используйте ДД.ММ.ГГГГ' };
    }
    
    const [day, month, year] = dateString.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime()) || 
        date.getDate() !== day || 
        date.getMonth() !== month - 1 || 
        date.getFullYear() !== year) {
      return { isValid: false, error: 'Неверная дата' };
    }
    
    return { isValid: true, error: '' };
  };

  const convertToISOFormat = (dateString: string) => {
    if (!dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) return '';
    const [day, month, year] = dateString.split('.').map(Number);
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const convertFromISOFormat = (dateString: string) => {
    if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
  };

  const formatDateTimeForDisplay = (date: string, time: string) => {
    if (!date) return '';
    const displayDate = convertFromISOFormat(date);
    return `${displayDate} ${time.substring(0, 5)}`;
  };

  const getDateTimeString = (date: string, time: string) => {
    if (!date) return '';
    const timeWithSeconds = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
    return `${date}T${timeWithSeconds}`;
  };

  const formatLocalDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Функция для быстрого выбора периода (точно как на странице статистики)
  const setQuickDateRange = (range: 'today' | 'yesterday' | 'week' | 'month') => {
       const now = new Date();
    const today = formatLocalDate(now);
    
    switch (range) {
      case 'today':
        setDateFromFilter(today);
        setDateToFilter(today);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        
        // Обновляем selectedRange для родительского компонента
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        onRangeChange({
          startDate: todayStart,
          endDate: todayEnd,
          label: 'Сегодня',
          type: 'preset'
        });
        break;
        
      case 'yesterday':
        const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterday = formatLocalDate(yesterdayDate);
        setDateFromFilter(yesterday);
        setDateToFilter(yesterday);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        
        const yesterdayStart = new Date(yesterdayDate.getFullYear(), yesterdayDate.getMonth(), yesterdayDate.getDate(), 0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterdayDate.getFullYear(), yesterdayDate.getMonth(), yesterdayDate.getDate(), 23, 59, 59, 999);
        onRangeChange({
          startDate: yesterdayStart,
          endDate: yesterdayEnd,
    label: 'Вчера',
          type: 'preset'
        });
        break;
        
      case 'week':
        // Получаем понедельник текущей недели
        const currentDay = now.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(now.getTime() + mondayOffset * 24 * 60 * 60 * 1000);
        const mondayStr = formatLocalDate(monday);
        
        // Получаем воскресенье текущей недели
        const sundayOffset = currentDay === 0 ? 0 : 7 - currentDay;
        const sunday = new Date(now.getTime() + sundayOffset * 24 * 60 * 60 * 1000);
        const sundayStr = formatLocalDate(sunday);
        
        setDateFromFilter(mondayStr);
        setDateToFilter(sundayStr);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        
        const weekStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0);
        const weekEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999);
        onRangeChange({
          startDate: weekStart,
          endDate: weekEnd,
          label: 'Неделя',
          type: 'preset'
        });
        break;
        
      case 'month':
        // Получаем первый день текущего месяца
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        
        // Получаем последний день текущего месяца
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const lastDay = lastDayOfMonth.getDate();
        const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        setDateFromFilter(firstDayStr);
        setDateToFilter(lastDayStr);
        setTimeFromFilter('00:00');
        setTimeToFilter('23:59');
        
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month, lastDay, 23, 59, 59, 999);
        onRangeChange({
          startDate: monthStart,
          endDate: monthEnd,
          label: 'Месяц',
          type: 'preset'
        });
        break;
    }
    setShowCustomPicker(false);
  };

  // Обработчики для редактирования дат
  const handleDateFromEdit = () => {
    setIsEditingDateFrom(true);
    setTempDateFrom(convertFromISOFormat(dateFromFilter));
  };

  const handleDateToEdit = () => {
    setIsEditingDateTo(true);
    setTempDateTo(convertFromISOFormat(dateToFilter));
  };

  const handleDateFromChange = (value: string) => {
    const formatted = formatDateInput(value, tempDateFrom);
    setTempDateFrom(formatted);
    
    if (!formatted || formatted.length === 0) {
      setDateFromFilter('');
      setTimeFromFilter('00:00');
      return;
    }
    
    const validation = validateDateInput(formatted);
    if (validation.isValid && formatted.length === 10) {
      const isoFormat = convertToISOFormat(formatted);
      setDateFromFilter(isoFormat);
      setTimeFromFilter('00:00');
      setIsEditingDateFrom(false);
    }
  };

  const handleDateToChange = (value: string) => {
    const formatted = formatDateInput(value, tempDateTo);
    setTempDateTo(formatted);
    
    if (!formatted || formatted.length === 0) {
      setDateToFilter('');
      setTimeToFilter('23:59');
      return;
    }
    
    const validation = validateDateInput(formatted);
    if (validation.isValid && formatted.length === 10) {
      const isoFormat = convertToISOFormat(formatted);
      setDateToFilter(isoFormat);
      setTimeToFilter('23:59');
      setIsEditingDateTo(false);
    }
  };

  const handleDateFromBlur = () => {
    if (!tempDateFrom || tempDateFrom.length === 0) {
      setDateFromFilter('');
      setTimeFromFilter('00:00');
      setIsEditingDateFrom(false);
      return;
    }
    
    const validation = validateDateInput(tempDateFrom);
    if (validation.isValid && tempDateFrom.length === 10) {
      const isoFormat = convertToISOFormat(tempDateFrom);
      setDateFromFilter(isoFormat);
      setTimeFromFilter('00:00');
    } else {
      setTempDateFrom('');
    }
    setIsEditingDateFrom(false);
  };

  const handleDateToBlur = () => {
    if (!tempDateTo || tempDateTo.length === 0) {
      setDateToFilter('');
      setTimeToFilter('23:59');
      setIsEditingDateTo(false);
      return;
    }
    
    const validation = validateDateInput(tempDateTo);
    if (validation.isValid && tempDateTo.length === 10) {
      const isoFormat = convertToISOFormat(tempDateTo);
      setDateToFilter(isoFormat);
      setTimeToFilter('23:59');
    } else {
      setTempDateTo('');
    }
    setIsEditingDateTo(false);
  };

  const handleCustomRangeApply = () => {
    if (!dateFromFilter || !dateToFilter) return;
    
    const startDate = new Date(getDateTimeString(dateFromFilter, timeFromFilter));
    const endDate = new Date(getDateTimeString(dateToFilter, timeToFilter));
    
    if (startDate > endDate) {
      alert('Дата начала не может быть позже даты окончания');
      return;
    }

    onRangeChange({
      startDate,
      endDate,
      label: `${convertFromISOFormat(dateFromFilter)} - ${convertFromISOFormat(dateToFilter)}`,
      type: 'custom'
    });
    setShowCustomPicker(false);
  };

  if (compact) {
    return (
      <div className="bg-gray-700/30 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30">
        <div className="flex items-center space-x-3 mb-3">
          <CalendarIcon className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Период анализа</span>
        </div>

        {/* Quick Date Range Buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setQuickDateRange('today')}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
          >
            Сегодня
          </button>
          <button
            onClick={() => setQuickDateRange('yesterday')}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20"
          >
            Вчера
          </button>
          <button
            onClick={() => setQuickDateRange('week')}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20"
          >
            Неделя
          </button>
            <button
            onClick={() => setQuickDateRange('month')}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20"
          >
            Месяц
            </button>
          
          {/* Custom Range Button */}
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

        {/* Custom Date Picker */}
        {showCustomPicker && (
          <div className="bg-gray-800/40 rounded-md p-3 border border-gray-600/20 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  От
                </label>
                <div className="relative">
                  {!isEditingDateFrom ? (
                    <button
                      type="button"
                      onClick={handleDateFromEdit}
                      className={`w-full flex items-center space-x-2 bg-gray-700/50 border border-gray-600/50 rounded px-2 py-1.5 hover:bg-gray-700/70 transition-all duration-200 cursor-pointer ${
                        dateFromFilter ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : ''
                      }`}
                    >
                      <CalendarDaysIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-white text-xs flex-1 text-left">
                        {dateFromFilter ? formatDateTimeForDisplay(dateFromFilter, timeFromFilter) : 'От даты'}
                      </span>
                      <ChevronUpDownIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    </button>
                  ) : (
                <input
                      type="text"
                      value={tempDateFrom}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                      onBlur={handleDateFromBlur}
                      placeholder="ДД.ММ.ГГГГ"
                  className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setTempDateFrom('');
                          setIsEditingDateFrom(false);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  До
                </label>
                <div className="relative">
                  {!isEditingDateTo ? (
                    <button
                      type="button"
                      onClick={handleDateToEdit}
                      className={`w-full flex items-center space-x-2 bg-gray-700/50 border border-gray-600/50 rounded px-2 py-1.5 hover:bg-gray-700/70 transition-all duration-200 cursor-pointer ${
                        dateToFilter ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : ''
                      }`}
                    >
                      <CalendarDaysIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-white text-xs flex-1 text-left">
                        {dateToFilter ? formatDateTimeForDisplay(dateToFilter, timeToFilter) : 'До даты'}
                      </span>
                      <ChevronUpDownIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    </button>
                  ) : (
                <input
                      type="text"
                      value={tempDateTo}
                      onChange={(e) => handleDateToChange(e.target.value)}
                      onBlur={handleDateToBlur}
                      placeholder="ДД.ММ.ГГГГ"
                  className="w-full px-2 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setTempDateTo('');
                          setIsEditingDateTo(false);
                        }
                      }}
                    />
                  )}
                </div>
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
                disabled={!dateFromFilter || !dateToFilter}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Применить
              </button>
            </div>
          </div>
        )}

        {/* Selected Range Display */}
        <div className="text-xs text-gray-400 flex items-center justify-between">
          <span>Период:</span>
          <span className="text-white font-medium bg-gray-600/20 px-2 py-1 rounded">
            {selectedRange.startDate.toLocaleDateString('ru-RU')} - {selectedRange.endDate.toLocaleDateString('ru-RU')}
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

      {/* Quick Date Range Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => setQuickDateRange('today')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20"
        >
          Сегодня
        </button>
        <button
          onClick={() => setQuickDateRange('yesterday')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20"
        >
          Вчера
        </button>
        <button
          onClick={() => setQuickDateRange('week')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20"
        >
          Неделя
        </button>
          <button
          onClick={() => setQuickDateRange('month')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20"
        >
          Месяц
          </button>
        
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
              <div className="relative">
                {!isEditingDateFrom ? (
                  <button
                    type="button"
                    onClick={handleDateFromEdit}
                    className={`w-full flex items-center space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-4 py-3 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer ${
                      dateFromFilter ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : ''
                    }`}
                  >
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <span className="text-white text-sm font-medium flex-1 text-left">
                      {dateFromFilter ? formatDateTimeForDisplay(dateFromFilter, timeFromFilter) : 'От даты'}
                    </span>
                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                ) : (
              <input
                    type="text"
                    value={tempDateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    onBlur={handleDateFromBlur}
                    placeholder="ДД.ММ.ГГГГ"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setTempDateFrom('');
                        setIsEditingDateFrom(false);
                      }
                    }}
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Дата окончания
              </label>
              <div className="relative">
                {!isEditingDateTo ? (
                  <button
                    type="button"
                    onClick={handleDateToEdit}
                    className={`w-full flex items-center space-x-3 bg-gray-700/30 border border-gray-600/50 rounded-lg px-4 py-3 hover:bg-gray-700/40 transition-all duration-200 cursor-pointer ${
                      dateToFilter ? 'ring-1 ring-indigo-500/50 border-indigo-500/50' : ''
                    }`}
                  >
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <span className="text-white text-sm font-medium flex-1 text-left">
                      {dateToFilter ? formatDateTimeForDisplay(dateToFilter, timeToFilter) : 'До даты'}
                    </span>
                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                ) : (
              <input
                    type="text"
                    value={tempDateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    onBlur={handleDateToBlur}
                    placeholder="ДД.ММ.ГГГГ"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setTempDateTo('');
                        setIsEditingDateTo(false);
                      }
                    }}
                  />
                )}
              </div>
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
              disabled={!dateFromFilter || !dateToFilter}
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
            {selectedRange.startDate.toLocaleDateString('ru-RU')} - {selectedRange.endDate.toLocaleDateString('ru-RU')}
          </div>
        </div>
      </div>
    </div>
  );
}