import {
  HomeIcon,
  TagIcon,
  CubeIcon,
  ShoppingBagIcon,
  UsersIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export const navigation = [
  { 
    name: 'Главная', 
    href: '/admin/dashboard', 
    icon: HomeIcon,
    color: 'text-blue-400',
    hoverColor: 'group-hover:text-blue-300',
    description: 'Обзор системы'
  },
  { 
    name: 'Товары', 
    href: '/admin/products', 
    icon: CubeIcon,
    color: 'text-green-400',
    hoverColor: 'group-hover:text-green-300',
    description: 'Управление каталогом'
  },
  { 
    name: 'Заказы', 
    href: '/admin/orders', 
    icon: ShoppingBagIcon,
    color: 'text-yellow-400',
    hoverColor: 'group-hover:text-yellow-300',
    description: 'Обработка заказов'
  },
  { 
    name: 'Категории', 
    href: '/admin/categories', 
    icon: TagIcon,
    color: 'text-purple-400',
    hoverColor: 'group-hover:text-purple-300',
    description: 'Структура каталога'
  },
  { 
    name: 'Сотрудники и филиалы', 
    href: '/admin/staff', 
    icon: UsersIcon,
    color: 'text-indigo-400',
    hoverColor: 'group-hover:text-indigo-300',
    description: 'Управление персоналом'
  },
  { 
    name: 'Настройки', 
    href: '/admin/settings', 
    icon: Cog6ToothIcon,
    color: 'text-gray-400',
    hoverColor: 'group-hover:text-gray-300',
    description: 'Конфигурация'
  },
];
