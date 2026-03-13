export const APP_MODULES = [
  'dashboard',
  'masters',
  'tours',
  'deals',
  'blogs',
  'crm',
  'customers',
  'careers',
  'support',
  'testimonials',
  'reports',
  'banners',
  'settings',
] as const;

export type AppModule = (typeof APP_MODULES)[number];

export const APP_ACTIONS = ['create', 'read', 'update', 'delete', 'publish', 'export'] as const;
export type AppAction = (typeof APP_ACTIONS)[number];

export type PermissionKey = `${AppModule}:${AppAction}`;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  SUPER_ADMIN: APP_MODULES.flatMap((module) => APP_ACTIONS.map((action) => `${module}:${action}` as PermissionKey)),
  ADMIN: APP_MODULES.flatMap((module) =>
    ['create', 'read', 'update', 'publish'].map((action) => `${module}:${action}` as PermissionKey),
  ),
  MANAGER: APP_MODULES.flatMap((module) =>
    ['read', 'update', 'publish'].map((action) => `${module}:${action}` as PermissionKey),
  ),
  SALES_EXEC: ['tours:read', 'tours:create', 'customers:read', 'customers:create', 'crm:read', 'crm:update'],
  VIEWER: APP_MODULES.map((module) => `${module}:read` as PermissionKey),
};
