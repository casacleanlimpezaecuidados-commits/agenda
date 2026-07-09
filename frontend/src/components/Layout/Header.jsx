import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Search,
  Bell,
  Calendar,
} from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-[1600px] mx-auto px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="capitalize">{formattedDate}</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <div className="animate-scale-in">
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    autoFocus
                    onBlur={() => setSearchOpen(false)}
                    className="w-56 px-3 py-1.5 pl-9 rounded-lg border border-gray-200 bg-gray-50 
                             text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 
                             outline-none transition-all"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full ring-2 ring-white" />
            </button>

            {/* User */}
            <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-gray-200">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-800 to-light rounded-full flex items-center justify-center text-white font-semibold text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-gray-900">{user?.name}</p>
                <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}