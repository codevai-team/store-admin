'use client';

import { ClockIcon, UserIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  itemsCount: number;
}

interface RecentOrdersProps {
  orders: Order[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      CREATED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      COURIER_WAIT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      COURIER_PICKED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      ENROUTE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELED: 'bg-red-500/20 text-red-400 border-red-500/30',
      // Для обратной совместимости со старыми статусами
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      paid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      CREATED: 'Создан',
      COURIER_WAIT: 'Ожидает курьера',
      COURIER_PICKED: 'Курьер принял',
      ENROUTE: 'В пути',
      DELIVERED: 'Доставлен',
      CANCELED: 'Отменен',
      // Для обратной совместимости со старыми статусами
      pending: 'Ожидает',
      paid: 'Оплачен',
      shipped: 'Отправлен',
      completed: 'Завершен',
      cancelled: 'Отменен'
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Последние заказы</h3>
          <p className="text-sm text-gray-400">Новые поступления</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Пока нет заказов</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-white">{order.customerName}</span>
                    </div>
                    <span className="text-sm text-gray-400">#{order.orderNumber}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      <span>{formatCurrency(order.totalPrice)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <span>{order.itemsCount} товар(ов)</span>
                  </div>
                </div>
                
                <div className="ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {orders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-600/30">
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200">
            Посмотреть все заказы →
          </button>
        </div>
      )}
    </div>
  );
}
