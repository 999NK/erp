import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  allowedRoles?: string[]; // Legacy compat — prefer requiredPermission
}

export function RouteGuard({ children, requiredPermission, allowedRoles }: RouteGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const location = useLocation();
  const { hasPermission, roleName, user } = usePermissions();

  useEffect(() => {
    const token = localStorage.getItem('@ERP:token');
    if (!token || !user) {
      setIsAuthorized(false);
      return;
    }

    // Check by permission key (preferred)
    if (requiredPermission) {
      setIsAuthorized(hasPermission(requiredPermission));
      return;
    }

    // Fallback: legacy role check
    if (allowedRoles) {
      setIsAuthorized(allowedRoles.includes(roleName));
      return;
    }

    setIsAuthorized(true);
  }, [requiredPermission, allowedRoles, roleName, user]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    const hasToken = !!localStorage.getItem('@ERP:token');
    if (!hasToken) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Redirect unauthorized users to their appropriate landing page
    const fallbackPath = roleName === 'EMPLOYEE' ? '/pdv' : '/dashboard';

    if (location.pathname === fallbackPath) {
      localStorage.removeItem('@ERP:token');
      localStorage.removeItem('@ERP:user');
      return <Navigate to="/login" replace />;
    }

    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
