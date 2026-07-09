import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCheck,
  History,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  Building2,
  Menu
} from 'lucide-react';

const menuItems = [
  {
    title: 'Principal',
    items: [
      { 
        path: '/dashboard', 
        icon: LayoutDashboard, 
        label: 'Dashboard',
        roles: ['admin', 'supervisor', 'funcionario']
      },
      { 
        path: '/schedule', 
        icon: CalendarDays, 
        label: 'Agenda',
        roles: ['admin', 'supervisor', 'funcionario']
      },
    ]
  },
  {
    title: 'Gestão',
    items: [
      { 
        path: '/clients', 
        icon: Building2, 
        label: 'Clientes',
        roles: ['admin', 'supervisor']
      },
      { 
        path: '/employees', 
        icon: UserCheck, 
        label: 'Funcionários',
        roles: ['admin']
      },
    ]
  },
  {
    title: 'Análises',
    items: [
      { 
        path: '/history', 
        icon: History, 
        label: 'Histórico',
        roles: ['admin', 'supervisor', 'funcionario']
      },
      { 
        path: '/reports', 
        icon: BarChart3, 
        label: 'Relatórios',
        roles: ['admin', 'supervisor']
      },
    ]
  },
];

export default function Sidebar({ onClose }) {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="h-screen bg-dark flex flex-col w-60 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-light rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary-500 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-light to-primary-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white leading-tight truncate">Casa & Clean</h1>
              <p className="text-[10px] text-gray-400">Gestão Operacional</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuItems.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                if (!hasRole(item.roles)) return null;
                
                const active = isActive(item.path);
                const Icon = item.icon;
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose?.()}
                    className={`
                      group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium
                      transition-all duration-200 relative
                      ${active 
                        ? 'bg-white/10 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${active ? 'text-light' : ''}`} />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-light rounded-full" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Card */}
      <div className="relative p-3 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-2.5">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-light to-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 text-xs text-gray-400 
                     hover:text-white hover:bg-white/10 rounded-md transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}