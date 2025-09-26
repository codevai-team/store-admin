'use client';


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { navigation } from '@/lib/navigation';



export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-72">
        <SidebarContent pathname={pathname} />
      </div>
    </div>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl m-4 shadow-2xl border border-gray-700/50">
      {/* Top spacing */}
      <div className="h-6"></div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-800 hover:to-gray-700 hover:text-white'
                  } group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="relative mr-4">
                    <div className={`absolute inset-0 rounded-lg blur-sm transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-transparent group-hover:bg-white/10'
                    }`}></div>
                    <item.icon
                      className={`relative h-6 w-6 transition-all duration-300 transform ${
                        isActive 
                          ? 'text-white scale-110' 
                          : `${item.color} ${item.hoverColor} group-hover:scale-110 group-hover:rotate-3`
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      {!isActive && (
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110"></div>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 transition-all duration-300 ${
                      isActive 
                        ? 'text-indigo-100' 
                        : 'text-gray-500 group-hover:text-gray-400'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </Link>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full shadow-lg shadow-indigo-500/50"></div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-b-2xl">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">© 2024 Bugu Store</div>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
