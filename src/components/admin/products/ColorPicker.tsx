'use client';

import { useState } from 'react';
import { SwatchIcon, EyeDropperIcon } from '@heroicons/react/24/outline';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const predefinedColors = [
  { name: 'Красный', value: '#ef4444' },
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Зеленый', value: '#10b981' },
  { name: 'Желтый', value: '#f59e0b' },
  { name: 'Фиолетовый', value: '#8b5cf6' },
  { name: 'Розовый', value: '#ec4899' },
  { name: 'Оранжевый', value: '#f97316' },
  { name: 'Бирюзовый', value: '#06b6d4' },
  { name: 'Лаймовый', value: '#84cc16' },
  { name: 'Индиго', value: '#6366f1' },
  { name: 'Черный', value: '#000000' },
  { name: 'Белый', value: '#ffffff' },
  { name: 'Серый', value: '#6b7280' },
  { name: 'Коричневый', value: '#92400e' },
  { name: 'Бежевый', value: '#fbbf24' },
  { name: 'Темно-синий', value: '#1e40af' },
];

export default function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(
    selectedColor && selectedColor.startsWith('#') ? selectedColor : '#ffffff'
  );
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handlePredefinedColorSelect = (color: string) => {
    onColorChange(color);
    setCustomColor(color);
    setShowCustomPicker(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onColorChange(color);
  };

  const getColorName = (color: string) => {
    const predefined = predefinedColors.find(c => c.value.toLowerCase() === color.toLowerCase());
    return predefined ? predefined.name : color;
  };

  return (
    <div className="space-y-3">
      {/* Selected Color Display */}
      <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
        <div 
          className="w-8 h-8 rounded border-2 border-gray-500 flex-shrink-0"
          style={{ backgroundColor: selectedColor || 'lab(27.1134% -.956401 -12.3224)' }}
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-white">
            {selectedColor ? getColorName(selectedColor) : 'Цвет не выбран'}
          </div>
          <div className="text-xs text-gray-400">
            {selectedColor || 'Выберите цвет ниже'}
          </div>
        </div>
      </div>

      {/* Predefined Colors Grid */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Популярные цвета</h4>
        <div className="grid grid-cols-8 gap-2">
          {predefinedColors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handlePredefinedColorSelect(color.value)}
              className={`w-8 h-8 rounded border-2 transition-all duration-200 hover:scale-110 ${
                selectedColor === color.value 
                  ? 'border-indigo-400 ring-2 ring-indigo-400/50' 
                  : 'border-gray-500 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">Пользовательский цвет</h4>
          <button
            type="button"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              showCustomPicker 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {showCustomPicker ? 'Скрыть' : 'Показать'}
          </button>
        </div>
        
        {showCustomPicker && (
          <div className="space-y-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
            {/* Color Input */}
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-12 h-8 rounded border border-gray-600 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/) || e.target.value === '') {
                    handleCustomColorChange(e.target.value);
                  }
                }}
                className="flex-1 px-3 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="#ffffff"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleCustomColorChange('#ffffff')}
                className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors"
              >
                Белый
              </button>
              <button
                type="button"
                onClick={() => handleCustomColorChange('#000000')}
                className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors"
              >
                Черный
              </button>
              <button
                type="button"
                onClick={() => {
                  const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
                  handleCustomColorChange(randomColor);
                }}
                className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors flex items-center space-x-1"
              >
                <SwatchIcon className="h-3 w-3" />
                <span>Случайный</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
