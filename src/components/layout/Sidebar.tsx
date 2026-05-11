import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Package, Users, Activity, ShoppingCart, Box, DollarSign, History, CheckSquare, PieChart, RefreshCw } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  permission: string; // Required permission key
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: Activity, path: '/dashboard', permission: 'dashboard.view' },
  { label: 'Financeiro', icon: DollarSign, path: '/financial', permission: 'financial.view' },
  { label: 'CRM / Pessoas', icon: Users, path: '/people', permission: 'customers.view' },
  { label: 'Produtos', icon: Package, path: '/products', permission: 'products.view' },
  { label: 'Estoque', icon: Box, path: '/stock', permission: 'stock.view' },
  { label: 'PDV', icon: ShoppingCart, path: '/pdv', permission: 'pos.access' },
  { label: 'Demandas', icon: CheckSquare, path: '/demands', permission: 'demands.view' },
  { label: 'Histórico de Vendas', icon: History, path: '/sales-history', permission: 'sales.view' },
  { label: 'Relatórios', icon: PieChart, path: '/reports', permission: 'reports.view' },
  { label: 'Gestão de Equipe', icon: Users, path: '/users', permission: 'users.view' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, roleName, user } = usePermissions();

  const handleLogout = () => {
    localStorage.removeItem('@ERP:token');
    localStorage.removeItem('@ERP:user');
    localStorage.removeItem('@ERP:originalUser');
    navigate('/login');
  };

  // Get simulated/impersonated user state
  const originalUserStr = localStorage.getItem('@ERP:originalUser');
  const originalUser = originalUserStr ? JSON.parse(originalUserStr) : null;
  const actualRole = originalUser ? originalUser.roleName : roleName;
  const isSimulated = !!originalUser;

  // Filter nav items by permission
  const navItems = ALL_NAV_ITEMS.filter(item => hasPermission(item.permission));

  const handleSimulate = (targetRole: 'MANAGER' | 'EMPLOYEE') => {
    if (!user) return;
    // Save original user if not already simulated
    if (!isSimulated) {
      localStorage.setItem('@ERP:originalUser', JSON.stringify(user));
    }
    // Update active user with simulated role
    const simulatedUser = {
      ...user,
      roleName: targetRole,
      // If simulated, override permissions to match target role defaults
      permissions: targetRole === 'MANAGER' ? [
        'dashboard.view',
        'products.view', 'products.create', 'products.edit',
        'stock.view', 'stock.adjust',
        'sales.view', 'sales.create', 'sales.cancel',
        'pos.access',
        'financial.view',
        'customers.view', 'customers.create', 'customers.edit',
        'suppliers.view', 'suppliers.create', 'suppliers.edit',
        'reports.view', 'reports.export',
        'users.view', 'users.create', 'users.edit', 'users.manage',
        'demands.view', 'demands.create', 'demands.edit',
      ] : [
        'dashboard.view',
        'pos.access',
        'sales.view', 'sales.create',
        'stock.view',
        'demands.view',
        'products.view',
        'customers.view',
      ]
    };
    localStorage.setItem('@ERP:user', JSON.stringify(simulatedUser));
    window.location.reload();
  };

  const handleResetSimulation = () => {
    if (originalUser) {
      localStorage.setItem('@ERP:user', JSON.stringify(originalUser));
      localStorage.removeItem('@ERP:originalUser');
      window.location.reload();
    }
  };

  return (
    <div className="w-full lg:w-64 bg-white border-r border-neutral-200/80 h-full flex flex-col flex-shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-neutral-100 font-extrabold text-lg md:text-xl tracking-tight text-indigo-600 gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-150">
          E
        </div>
        <span>Enterprise ERP</span>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50/50'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-indigo-600' : 'text-neutral-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Impersonate Simulator (Responsive & Fully functional for Admin & Manager) */}
      {(actualRole === 'ADMIN' || actualRole === 'MANAGER') && (
        <div className="p-4 border-t border-neutral-100 bg-indigo-50/30 flex-shrink-0 space-y-2">
          <p className="text-[10px] uppercase font-bold text-indigo-400 px-1">Simular Perfil</p>
          
          {isSimulated ? (
            <button
              onClick={handleResetSimulation}
              className="w-full py-2 px-3 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Voltar para {actualRole === 'ADMIN' ? 'Admin' : 'Gerente'}</span>
            </button>
          ) : (
            <div className="flex gap-2">
              {actualRole === 'ADMIN' && (
                <button
                  onClick={() => handleSimulate('MANAGER')}
                  className="flex-1 py-1.5 text-[11px] font-bold bg-white border border-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  GERENTE
                </button>
              )}
              <button
                onClick={() => handleSimulate('EMPLOYEE')}
                className="flex-1 py-1.5 text-[11px] font-bold bg-white border border-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                FUNCIONÁRIO
              </button>
            </div>
          )}
        </div>
      )}

      {/* User Info + Logout */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50/30 flex-shrink-0 space-y-3">
        {user && (
          <div className="px-2">
            <p className="text-sm font-bold text-neutral-800 truncate">{user.name || 'Usuário'}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <span>{roleName}</span>
              {isSimulated && (
                <span className="bg-amber-100 text-amber-800 text-[8px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">
                  Simulado
                </span>
              )}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-neutral-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-neutral-400" />
          <span>Sair do ERP</span>
        </button>
      </div>
    </div>
  );
}
