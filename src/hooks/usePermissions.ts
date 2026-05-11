import { useMemo } from 'react';

// ─────────────────────────────────────────────────────
// Permission Catalog — Single source of truth (frontend)
// ─────────────────────────────────────────────────────
export const PERMISSION_CATALOG = {
  dashboard:  ['dashboard.view'],
  products:   ['products.view', 'products.create', 'products.edit', 'products.delete'],
  stock:      ['stock.view', 'stock.adjust'],
  sales:      ['sales.view', 'sales.create', 'sales.cancel'],
  pos:        ['pos.access'],
  financial:  ['financial.view', 'financial.create', 'financial.edit', 'financial.delete'],
  customers:  ['customers.view', 'customers.create', 'customers.edit', 'customers.delete'],
  suppliers:  ['suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete'],
  reports:    ['reports.view', 'reports.export'],
  users:      ['users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage'],
  demands:    ['demands.view', 'demands.create', 'demands.edit', 'demands.delete'],
  settings:   ['settings.view', 'settings.edit'],
} as const;

// ─────────────────────────────────────────────────────
// Default permissions by role
// ─────────────────────────────────────────────────────
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'],
  MANAGER: [
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
  ],
  EMPLOYEE: [
    'dashboard.view',
    'pos.access',
    'sales.view', 'sales.create',
    'stock.view',
    'demands.view',
    'products.view',
    'customers.view',
  ],
};

interface UserData {
  id: string;
  roleName: string;
  permissions?: string[];
  companyId: string;
}

function getUserFromStorage(): UserData | null {
  try {
    const raw = localStorage.getItem('@ERP:user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function usePermissions() {
  const user = getUserFromStorage();
  const roleName = user?.roleName || 'EMPLOYEE';

  const effectivePermissions = useMemo(() => {
    // User-level overrides take precedence if set
    if (user?.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
      return user.permissions;
    }
    return DEFAULT_ROLE_PERMISSIONS[roleName] || DEFAULT_ROLE_PERMISSIONS['EMPLOYEE'];
  }, [roleName, user?.permissions]);

  const hasPermission = (key: string): boolean => {
    if (effectivePermissions.includes('*')) return true;
    return effectivePermissions.includes(key);
  };

  const canView = (module: string): boolean => hasPermission(`${module}.view`) || hasPermission(`${module}.access`);
  const canCreate = (module: string): boolean => hasPermission(`${module}.create`);
  const canEdit = (module: string): boolean => hasPermission(`${module}.edit`);
  const canDelete = (module: string): boolean => hasPermission(`${module}.delete`);
  const canExport = (module: string): boolean => hasPermission(`${module}.export`);

  const isAdmin = roleName === 'ADMIN';
  const isManager = roleName === 'MANAGER';
  const isEmployee = roleName === 'EMPLOYEE';

  return {
    roleName,
    effectivePermissions,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    isAdmin,
    isManager,
    isEmployee,
    user,
  };
}
