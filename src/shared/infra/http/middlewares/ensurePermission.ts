import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that checks if the authenticated user has a specific permission.
 * This works in conjunction with the RBAC hierarchy:
 * 
 * - ADMIN (level 3): Has wildcard '*' — passes all checks.
 * - MANAGER (level 2): Has a subset of permissions.
 * - EMPLOYEE (level 1): Has minimal operational permissions.
 * 
 * Usage in routes:
 *   router.get('/financial', ensurePermission('financial.view'), controller.list);
 *   router.post('/products', ensurePermission('products.create'), controller.create);
 */

const ROLE_HIERARCHY: Record<string, number> = {
  'ADMIN': 3,
  'MANAGER': 2,
  'EMPLOYEE': 1,
};

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  'ADMIN': ['*'],
  'MANAGER': [
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
  'EMPLOYEE': [
    'dashboard.view',
    'pos.access',
    'sales.view', 'sales.create',
    'stock.view',
    'demands.view',
    'products.view',
    'customers.view',
  ],
};

export function ensurePermission(permissionKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.user;

    if (!role) {
      return res.status(403).json({ success: false, message: 'Permissão insuficiente: role não encontrada.' });
    }

    // Admin bypass — full access
    const permissions = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS['EMPLOYEE'];
    if (permissions.includes('*') || permissions.includes(permissionKey)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Acesso negado: permissão '${permissionKey}' requerida.`
    });
  };
}

/**
 * Check if a role has at least a minimum hierarchy level.
 * Usage: ensureMinRole('MANAGER') — blocks EMPLOYEE, allows MANAGER and ADMIN.
 */
export function ensureMinRole(minRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.user;
    const userLevel = ROLE_HIERARCHY[role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel >= requiredLevel) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Acesso negado: nível mínimo '${minRole}' requerido.`
    });
  };
}
