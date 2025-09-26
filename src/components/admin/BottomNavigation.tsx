'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation } from '@/lib/navigation';

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Градиентный фон как в sidebar */}
      <div className="bg-gradient-to-t from-gray-900 to-gray-800 backdrop-blur-sm border-t border-gray-700/50 shadow-2xl">
        <div className="flex items-center justify-around px-2 py-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-all duration-300 group
                  ${isActive 
                    ? item.color 
                    : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-xl transition-all duration-300 transform
                  ${isActive 
                    ? 'bg-gray-800/80 scale-110 shadow-lg ring-2 ring-gray-600/30' 
                    : 'hover:bg-gray-700/50 hover:scale-105 group-hover:shadow-md'
                  }
                `}>
                  <Icon className={`
                    h-6 w-6 transition-all duration-300
                    ${isActive 
                      ? 'filter drop-shadow-lg' 
                      : 'group-hover:scale-110'
                    }
                  `} />
                </div>
                
                {/* Индикатор активности */}
                {isActive && (
                  <div className={`
                    w-1 h-1 mt-1 rounded-full transition-all duration-300
                    ${item.color.replace('text-', 'bg-')}
                  `} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
