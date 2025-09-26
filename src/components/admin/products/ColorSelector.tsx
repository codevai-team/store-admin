'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Color {
  id: string;
  name: string;
  colorCode: string;
}

interface ColorSelectorProps {
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
}

export default function ColorSelector({ selectedColors, onColorsChange }: ColorSelectorProps) {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const response = await fetch('/api/admin/colors');
      if (response.ok) {
        const colorsData = await response.json();
        setColors(colorsData);
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleColor = (colorName: string) => {
    if (selectedColors.includes(colorName)) {
      onColorsChange(selectedColors.filter(c => c !== colorName));
    } else {
      onColorsChange([...selectedColors, colorName]);
    }
  };

  const addColor = async () => {
    if (!newColorName.trim() || !newColorCode.trim()) return;

    setAdding(true);
    try {
      const response = await fetch('/api/admin/colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: newColorName.trim(),
          colorCode: newColorCode.trim()
        }),
      });

      if (response.ok) {
        const newColor = await response.json();
        setColors(prev => [...prev, newColor]);
        setNewColorName('');
        setNewColorCode('#000000');
        setShowAddForm(false);
        // Автоматически выбираем новый цвет
        onColorsChange([...selectedColors, newColor.name]);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка создания цвета');
      }
    } catch (error) {
      console.error('Error adding color:', error);
      alert('Ошибка создания цвета');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-20 h-12 bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {colors.map(color => {
          const isSelected = selectedColors.includes(color.name);
          return (
            <button
              key={color.id}
              type="button"
              onClick={() => toggleColor(color.name)}
              className={`
                relative px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 min-w-[4rem] flex items-center justify-center space-x-2 bg-gray-700/30
                ${isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'border-gray-600 hover:border-gray-500'
                }
              `}
            >
              {/* Цветовой круг */}
              <div 
                className="w-5 h-5 rounded-full border border-gray-400/50 shadow-sm"
                style={{ backgroundColor: color.colorCode }}
              />
              
              {/* Название цвета */}
              <span className="text-xs text-gray-200">
                {color.name}
              </span>

              {/* Иконка выбора */}
              {isSelected && (
                <CheckIcon className="absolute top-1 right-1 h-3 w-3 text-indigo-400" />
              )}
            </button>
          );
        })}
        
        {/* Кнопка добавления нового цвета */}
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all duration-200 flex items-center space-x-1 min-w-[4rem]"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Добавить</span>
        </button>
      </div>

      {/* Форма добавления нового цвета */}
      {showAddForm && (
        <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Название цвета (Красный, Синий, etc.)"
              className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={newColorCode}
                onChange={(e) => setNewColorCode(e.target.value)}
                className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={newColorCode}
                onChange={(e) => setNewColorCode(e.target.value)}
                placeholder="#000000"
                className="w-24 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
          
          {/* Предпросмотр цвета */}
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded border border-gray-600"
              style={{ backgroundColor: newColorCode }}
            />
            <span className="text-gray-300 text-sm">
              Предпросмотр: {newColorName || 'Новый цвет'}
            </span>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={addColor}
              disabled={adding || !newColorName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
            >
              {adding ? 'Добавляем...' : 'Добавить'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewColorName('');
                setNewColorCode('#000000');
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {selectedColors.length > 0 && (
        <div className="text-sm text-gray-400">
          Выбрано цветов: {selectedColors.join(', ')}
        </div>
      )}
    </div>
  );
}

// Функция для определения яркости цвета
function getBrightness(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}
