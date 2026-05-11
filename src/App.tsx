/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { ProductsPage } from './pages/Products';
import { StockPage } from './pages/Stock';
import { PDVPage } from './pages/PDV';
import { FinancialPage } from './pages/Financial';
import { PeoplePage } from './pages/People';
import { ReportsPage } from './pages/Reports';
import { Users } from './pages/Users';
import { Demands } from './pages/Demands';
import SalesHistory from './pages/SalesHistory';
import { RouteGuard } from './components/layout/RouteGuard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 500 },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<RouteGuard requiredPermission="dashboard.view"><Dashboard /></RouteGuard>} />
            <Route path="/products" element={<RouteGuard requiredPermission="products.view"><ProductsPage /></RouteGuard>} />
            <Route path="/stock" element={<RouteGuard requiredPermission="stock.view"><StockPage /></RouteGuard>} />
            <Route path="/pdv" element={<RouteGuard requiredPermission="pos.access"><PDVPage /></RouteGuard>} />
            <Route path="/sales-history" element={<RouteGuard requiredPermission="sales.view"><SalesHistory /></RouteGuard>} />
            <Route path="/financial" element={<RouteGuard requiredPermission="financial.view"><FinancialPage /></RouteGuard>} />
            <Route path="/people" element={<RouteGuard requiredPermission="customers.view"><PeoplePage /></RouteGuard>} />
            <Route path="/demands" element={<RouteGuard requiredPermission="demands.view"><Demands /></RouteGuard>} />
            <Route path="/users" element={<RouteGuard requiredPermission="users.view"><Users /></RouteGuard>} />
            <Route path="/reports" element={<RouteGuard requiredPermission="reports.view"><ReportsPage /></RouteGuard>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
