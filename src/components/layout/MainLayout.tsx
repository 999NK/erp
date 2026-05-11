import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X, ChevronRight, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar drawer automatically on route navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Lock body scroll on mobile when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  // Extract page title dynamically based on path
  const getPageTitle = () => {
    const paths: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/financial': 'Financeiro',
      '/products': 'Produtos',
      '/stock': 'Estoque',
      '/pdv': 'PDV / Caixa',
      '/sales-history': 'Histórico de Vendas',
      '/users': 'Usuários',
    };
    return paths[location.pathname] || 'Workspace';
  };

  const userJson = localStorage.getItem('@ERP:user');
  const user = userJson ? JSON.parse(userJson) : null;
  const companyName = user?.company?.name || 'Minha Empresa';

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans overflow-x-hidden antialiased pt-safe pb-safe pl-safe pr-safe">
      
      {/* Desktop Sidebar (hidden on mobile/tablet below lg) */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer (AnimatePresence slide-out) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
            />

            {/* Sidebar container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden bg-white shadow-2xl flex flex-col h-full"
            >
              {/* Close drawer button */}
              <div className="absolute top-4 right-4 z-50">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-600 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar content */}
              <div className="flex-1 overflow-y-auto">
                <Sidebar />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Universal Topbar */}
        <header className="h-16 bg-white border-b border-neutral-200/80 flex items-center px-4 md:px-6 justify-between flex-shrink-0 z-30">
          
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-neutral-500 hover:text-neutral-800 rounded-xl hover:bg-neutral-100/80 lg:hidden transition-all focus:outline-none cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>

            {/* Workspace / Route Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-400 hidden sm:inline max-w-[120px] truncate">{companyName}</span>
              <ChevronRight className="w-4 h-4 text-neutral-300 hidden sm:block" />
              <h1 className="text-base md:text-lg font-bold text-neutral-800 tracking-tight">{getPageTitle()}</h1>
            </div>
          </div>

          {/* Right User Actions */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-xs font-bold text-neutral-800">{user?.name || 'Administrador'}</span>
              <span className="text-[10px] text-neutral-400 font-medium">Empresa SaaS</span>
            </div>
            
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center shadow-sm">
              <User className="w-4.5 h-4.5" />
            </div>
          </div>
        </header>
        
        {/* Main scrollable body */}
        <main className="flex-1 overflow-y-auto bg-neutral-50/50 relative">
          <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
