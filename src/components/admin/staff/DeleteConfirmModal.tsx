'use client';

import {
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    shifts: number;
    orders: number;
  };
}

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
  _count: {
    shifts: number;
  };
  shifts: Array<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    store: {
      id: string;
      name: string;
    };
  }>;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  target: {
    type: 'store' | 'user';
    item: Store | User;
  } | null;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  target,
  loading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen || !target) return null;

  const isStore = target.type === 'store';
  const item = target.item;
  const name = isStore ? (item as Store).name : (item as User).name;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-3 z-50">
      <div className="bg-gray-900/98 backdrop-blur-lg rounded-2xl w-full max-w-md border border-gray-700/30 shadow-2xl ring-1 ring-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Подтвердите удаление
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-red-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrashIcon className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white mb-2">
                Удалить {isStore ? 'филиал' : 'сотрудника'}?
              </h3>
              <p className="text-gray-300 mb-4">
                Вы уверены, что хотите удалить {isStore ? 'филиал' : 'сотрудника'}{' '}
                <span className="font-medium text-white">"{name}"</span>?
              </p>

              {/* Warnings */}
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-300">
                    <p className="font-medium mb-1">Внимание!</p>
                    <p>
                      {isStore 
                        ? 'Филиал можно удалить только если у него нет активных смен и заказов.'
                        : 'Сотрудника можно удалить только если у него нет активных смен.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {isStore && (
                <div className="bg-gray-800/30 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-400 mb-2">Связанные данные:</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-white font-medium">{(item as Store)._count.shifts}</div>
                      <div className="text-gray-400 text-xs">Смены</div>
                    </div>
                    <div>
                      <div className="text-white font-medium">{(item as Store)._count.orders}</div>
                      <div className="text-gray-400 text-xs">Заказы</div>
                    </div>
                  </div>
                </div>
              )}

              {!isStore && (
                <div className="bg-gray-800/30 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-400 mb-2">Связанные данные:</div>
                  <div className="text-sm">
                    <div className="text-white font-medium">{(item as User)._count.shifts}</div>
                    <div className="text-gray-400 text-xs">Смены</div>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Это действие нельзя отменить.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-700/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <TrashIcon className="h-4 w-4" />
            <span>{loading ? 'Удаление...' : 'Удалить'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
