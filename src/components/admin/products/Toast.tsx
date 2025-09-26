'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
    textColor: 'text-green-300',
    iconColor: 'text-green-400',
  },
  error: {
    icon: XCircleIcon,
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-300',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-300',
    iconColor: 'text-yellow-400',
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-300',
    iconColor: 'text-blue-400',
  },
};

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    // Показать тост
    setIsVisible(true);

    // Автоматически скрыть через duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Время анимации выхода
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`max-w-sm w-full ${config.bgColor} ${config.borderColor} border backdrop-blur-md rounded-xl p-4 shadow-2xl`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-semibold ${config.textColor}`}>
              {title}
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message: string;
    duration?: number;
  }>;
  onRemoveToast: (id: string) => void;
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  );
}
