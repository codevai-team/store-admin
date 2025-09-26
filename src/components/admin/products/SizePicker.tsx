'use client';

import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SizePickerProps {
  selectedSize: string;
  onSizeChange: (size: string) => void;
}

// Предустановленные размеры с группировкой
const predefinedSizes = {
  clothing: {
    name: 'Одежда',
    sizes: [
      { display: 'XS', value: 'XS' },
      { display: 'S', value: 'S' },
      { display: 'M', value: 'M' },
      { display: 'L', value: 'L' },
      { display: 'XL', value: 'XL' },
      { display: 'XXL', value: 'XXL' },
      { display: 'XXXL', value: 'XXXL' },
    ]
  },
  numeric: {
    name: 'Цифровые',
    sizes: [
      { display: 'XS (36)', value: '36' },
      { display: 'S (38)', value: '38' },
      { display: 'M (40)', value: '40' },
      { display: 'L (42)', value: '42' },
      { display: 'XL (44)', value: '44' },
      { display: 'XXL (46)', value: '46' },
      { display: 'XXXL (48)', value: '48' },
      { display: 'XXXXL (50)', value: '50' },
    ]
  },
  shoes: {
    name: 'Обувь',
    sizes: [
      { display: '35', value: '35' },
      { display: '36', value: '36' },
      { display: '37', value: '37' },
      { display: '38', value: '38' },
      { display: '39', value: '39' },
      { display: '40', value: '40' },
      { display: '41', value: '41' },
      { display: '42', value: '42' },
      { display: '43', value: '43' },
      { display: '44', value: '44' },
      { display: '45', value: '45' },
      { display: '46', value: '46' },
    ]
  }
};

export default function SizePicker({ selectedSize, onSizeChange }: SizePickerProps) {
  const [customSize, setCustomSize] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof typeof predefinedSizes>('clothing');

  const handleSizeSelect = (size: string) => {
    onSizeChange(size);
    setShowCustomInput(false);
    setCustomSize('');
  };

  const handleCustomSizeAdd = () => {
    if (customSize.trim()) {
      onSizeChange(customSize.trim());
      setCustomSize('');
      setShowCustomInput(false);
    }
  };

  const isSelectedSize = (size: string) => selectedSize === size;

  return (
    <div className="space-y-4">
      {/* Selected Size Display */}
      <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
        <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-sm font-bold text-white border border-gray-500">
          {selectedSize || '?'}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">
            {selectedSize ? `Размер: ${selectedSize}` : 'Размер не выбран'}
          </div>
          <div className="text-xs text-gray-400">
            {selectedSize ? 'Выбранный размер' : 'Выберите размер ниже'}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 bg-gray-700/20 p-1 rounded-lg">
        {Object.entries(predefinedSizes).map(([key, category]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategory(key as keyof typeof predefinedSizes)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-all duration-200 ${
              activeCategory === key
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Size Buttons */}
      <div>
        <div className="grid grid-cols-4 gap-2">
          {predefinedSizes[activeCategory].sizes.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => handleSizeSelect(size.value)}
              className={`px-3 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                isSelectedSize(size.value)
                  ? 'border-indigo-400 bg-indigo-600/20 text-indigo-300'
                  : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
              }`}
            >
              {size.display}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Size */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">Пользовательский размер</h4>
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              showCustomInput 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {showCustomInput ? 'Скрыть' : 'Добавить'}
          </button>
        </div>

        {showCustomInput && (
          <div className="space-y-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
            <div className="flex space-x-2">
              <input
                type="text"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomSizeAdd()}
                className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Введите размер (например: 44-46, One Size, Custom)"
              />
              <button
                type="button"
                onClick={handleCustomSizeAdd}
                disabled={!customSize.trim()}
                className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            
            {/* Quick Custom Sizes */}
            <div className="flex flex-wrap gap-1">
              {['One Size', 'Free Size', 'Universal', 'OS'].map((quickSize) => (
                <button
                  key={quickSize}
                  type="button"
                  onClick={() => handleSizeSelect(quickSize)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    isSelectedSize(quickSize)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {quickSize}
                </button>
              ))}
            </div>

            {/* Size Range Helper */}
            <div className="text-xs text-gray-500">
              💡 Примеры: "44-46", "S/M", "EU 42", "UK 10", "US 8", "One Size"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
