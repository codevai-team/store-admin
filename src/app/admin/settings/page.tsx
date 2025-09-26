'use client';

import { useState, useEffect } from 'react';
import { 
  KeyIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  BellIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import { ToastContainer } from '@/components/admin/products/Toast';
import { useToast } from '@/hooks/useToast';

interface Settings {
  admin_login?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

export default function Settings() {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false
  });
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Telegram form state
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data);
      setNewLogin(data.admin_login || '');
      setTelegramBotToken(data.TELEGRAM_BOT_TOKEN || '');
      setTelegramChatId(data.TELEGRAM_CHAT_ID || '');
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      showError('Ошибка валидации', 'Введите текущий пароль');
      return;
    }

    try {
      setVerifyingPassword(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'verify_password',
          currentPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error === 'Invalid current password') {
          showError('Неверный пароль', 'Введенный пароль не совпадает с текущим');
        } else {
          showError('Ошибка проверки', data.error || 'Ошибка проверки пароля');
        }
        return;
      }

      setIsPasswordVerified(true);
      showSuccess('Пароль подтвержден', 'Теперь вы можете изменить логин и пароль');
    } catch (err) {
      showError('Ошибка соединения', 'Не удалось проверить пароль. Проверьте соединение.');
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordVerified) {
      showError('Ошибка валидации', 'Сначала подтвердите текущий пароль');
      return;
    }

    if (!newLogin && !newPassword) {
      showError('Ошибка валидации', 'Введите новый логин или пароль');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      showError('Ошибка валидации', 'Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'auth',
          currentPassword,
          newLogin: newLogin !== settings.admin_login ? newLogin : undefined,
          newPassword: newPassword || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update auth settings');
      }

      showSuccess('Настройки обновлены', 'Настройки авторизации успешно обновлены');
      
      // Очищаем форму и сбрасываем состояние
      setCurrentPassword('');
      setNewPassword('');
      setIsPasswordVerified(false);
      
      // Обновляем настройки
      await fetchSettings();
    } catch (err) {
      showError('Ошибка обновления', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleTelegramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'telegram',
          telegramBotToken,
          telegramChatId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update Telegram settings');
      }

      showSuccess('Настройки обновлены', 'Настройки Telegram успешно обновлены');
      await fetchSettings();
    } catch (err) {
      showError('Ошибка обновления', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewLogin('');
    setNewPassword('');
    setIsPasswordVerified(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50">
          <h1 className="text-3xl font-bold text-white mb-2">
            Настройки системы
          </h1>
          <p className="text-gray-300">
            Управление параметрами авторизации и интеграций
          </p>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Auth Settings */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Авторизация</h2>
                  <p className="text-sm text-gray-400">Изменение логина и пароля администратора</p>
                </div>
              </div>
              <div className="relative group">
                <div className="p-1.5 bg-blue-500/20 rounded-lg cursor-help">
                  <ExclamationCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="absolute right-0 top-8 w-72 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <h4 className="text-sm font-semibold text-blue-300 mb-1">Безопасность</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Для изменения логина или пароля требуется ввод текущего пароля. 
                    Пароль должен содержать минимум 6 символов.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 1: Password Verification */}
            {!isPasswordVerified ? (
              <form onSubmit={handlePasswordVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Текущий пароль *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите текущий пароль"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyingPassword || !currentPassword}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                >
                  {verifyingPassword ? 'Проверка...' : 'Подтвердить пароль'}
                </button>
              </form>
            ) : (
              /* Step 2: Update Form */
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Current Password Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Текущий пароль
                  </label>
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-300 text-sm">Пароль подтвержден</span>
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs text-gray-400 hover:text-gray-300 underline"
                    >
                      Изменить
                    </button>
                  </div>
                </div>

                {/* New Login */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Новый логин
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={newLogin}
                      onChange={(e) => setNewLogin(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите новый логин (оставьте пустым, если не меняете)"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Новый пароль
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите новый пароль (оставьте пустым, если не меняете)"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                  {newPassword && newPassword.length > 0 && newPassword.length < 6 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Пароль должен содержать минимум 6 символов
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving || (!newLogin && !newPassword)}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                >
                  {saving ? 'Сохранение...' : 'Обновить данные'}
                </button>
              </form>
            )}
          </div>

          {/* Telegram Settings */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BellIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Telegram</h2>
                  <p className="text-sm text-gray-400">Настройки уведомлений в Telegram</p>
                </div>
              </div>
              <div className="relative group">
                <div className="p-1.5 bg-blue-500/20 rounded-lg cursor-help">
                  <ExclamationCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="absolute right-0 top-8 w-72 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <h4 className="text-sm font-semibold text-blue-300 mb-1">Уведомления</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Настройте Telegram бота для получения уведомлений о новых заказах 
                    и важных событиях в системе.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleTelegramSubmit} className="space-y-4">
              {/* Bot Token */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bot Token
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Получите токен у @BotFather в Telegram
                </p>
              </div>

              {/* Chat ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chat ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="-1001234567890"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ID чата или канала для отправки уведомлений
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
              >
                {saving ? 'Сохранение...' : 'Обновить Telegram'}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </AdminLayout>
  );
}
