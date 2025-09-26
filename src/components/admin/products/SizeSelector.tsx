'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Size {
  id: string;
  name: string;
}

interface SizeSelectorProps {
  selectedSizes: string[];
  onSizesChange: (sizes: string[]) => void;
}

export default function SizeSelector({ selectedSizes, onSizesChange }: SizeSelectorProps) {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      const response = await fetch('/api/admin/sizes');
      if (response.ok) {
        const sizesData = await response.json();
        setSizes(sizesData);
      }
    } catch (error) {
      console.error('Error fetching sizes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSize = (sizeName: string) => {
    if (selectedSizes.includes(sizeName)) {
      onSizesChange(selectedSizes.filter(s => s !== sizeName));
    } else {
      onSizesChange([...selectedSizes, sizeName]);
    }
  };

  const addSize = async () => {
    if (!newSizeName.trim()) return;

    setAdding(true);
    try {
      const response = await fetch('/api/admin/sizes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newSizeName.trim() }),
      });

      if (response.ok) {
        const newSize = await response.json();
        setSizes(prev => [...prev, newSize]);
        setNewSizeName('');
        setShowAddForm(false);
        // Автоматически выбираем новый размер
        onSizesChange([...selectedSizes, newSize.name]);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка создания размера');
      }
    } catch (error) {
      console.error('Error adding size:', error);
      alert('Ошибка создания размера');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-16 h-8 bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {sizes.map(size => (
          <button
            key={size.id}
            type="button"
            onClick={() => toggleSize(size.name)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200
              ${selectedSizes.includes(size.name)
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
              }
            `}
          >
            {size.name}
          </button>
        ))}
        
        {/* Кнопка добавления нового размера */}
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all duration-200 flex items-center space-x-1"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Добавить</span>
        </button>
      </div>

      {/* Форма добавления нового размера */}
      {showAddForm && (
        <div className="flex space-x-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <input
            type="text"
            value={newSizeName}
            onChange={(e) => setNewSizeName(e.target.value)}
            placeholder="Название размера (S, M, L, XL, etc.)"
            className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSize();
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={addSize}
            disabled={adding || !newSizeName.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
          >
            {adding ? 'Добавляем...' : 'Добавить'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
              setNewSizeName('');
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
          >
            Отмена
          </button>
        </div>
      )}

      {selectedSizes.length > 0 && (
        <div className="text-sm text-gray-400">
          Выбрано размеров: {selectedSizes.join(', ')}
        </div>
      )}
    </div>
  );
}
