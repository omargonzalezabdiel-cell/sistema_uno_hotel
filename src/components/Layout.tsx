import {
  LayoutDashboard, ListChecks, Search, Users, LogOut, PlusCircle,
  BedDouble, ChefHat, Sparkles, MessageSquare, Megaphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  canManageUsers, canCreateRequest, canManageRooms,
  canAccessKitchen, canAccessCleaning, canAccessMessages,
  canSendAnnouncements, getRoleLabel,
} from '../lib/auth';
import { Logo } from './Logo';
import type { RouterState, PageName } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (state: RouterState) => void;
  currentPage: RouterState['page'];
}

export function Layout({ children, onNavigate, currentPage }: LayoutProps) {
  const { user, logout } = useAuth();

  const navItems: { page: PageName; label: string; Icon: typeof LayoutDashboard }[] = [];

  const isAdmin = ['creador', 'super_admin'].includes(user?.role ?? '');
  const isRecep = user?.role === 'recepcionista';
  const isSupervisor = user?.role === 'supervisor';

  if (isAdmin || isRecep || isSupervisor) {
    navItems.push({ page: 'dashboard', label: 'Inicio', Icon: LayoutDashboard });
  }

  if (canManageRooms(user)) {
    navItems.push({ page: 'rooms', label: 'Hab.', Icon: BedDouble });
  }

  if (isAdmin || isRecep || isSupervisor) {
    navItems.push({ page: 'requests-list', label: 'Solicitudes', Icon: ListChecks });
  }

  if (canAccessKitchen(user) && isAdmin) {
    navItems.push({ page: 'kitchen', label: 'Cocina', Icon: ChefHat });
  }

  if (canAccessCleaning(user) && isAdmin) {
    navItems.push({ page: 'cleaning', label: 'Limpieza', Icon: Sparkles });
  }

  if (canAccessMessages(user)) {
    navItems.push({ page: 'messages', label: 'Mensajes', Icon: MessageSquare });
  }

  if (canSendAnnouncements(user)) {
    navItems.push({ page: 'announcements', label: 'Avisos', Icon: Megaphone });
  }

  if (isAdmin || isRecep || isSupervisor) {
    navItems.push({ page: 'search', label: 'Buscar', Icon: Search });
  }

  if (canManageUsers(user)) {
    navItems.push({ page: 'users', label: 'Usuarios', Icon: Users });
  }

  const visibleNav = navItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => onNavigate({ page: 'dashboard' })}
            className="focus:outline-none"
            aria-label="Ir al inicio"
          >
            <Logo size={32} />
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.username}</p>
              <p className="text-xs text-slate-400">{getRoleLabel(user?.role ?? '')}</p>
            </div>

            {canCreateRequest(user) && (
              <button
                onClick={() => onNavigate({ page: 'request-form' })}
                className="flex items-center gap-1.5 bg-sky-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-sky-700 active:scale-95 transition-all"
                aria-label="Nueva solicitud"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Nueva Solicitud</span>
              </button>
            )}

            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto flex">
          {visibleNav.map(({ page, label, Icon }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => onNavigate({ page })}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative ${
                  active ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className={`text-xs font-medium ${active ? 'text-sky-600' : ''}`}>
                  {label}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sky-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
