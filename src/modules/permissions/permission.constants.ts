export const APP_MODULES = [
  'dashboard',
  'masters',
  'tours',
  'speciality-tours',
  'deals',
  'blogs',
  'crm',
  'customers',
  'careers',
  'support',
  'testimonials',
  'reports',
  'banners',
  'website-users',
  'settings',
] as const;

export type AppModule = (typeof APP_MODULES)[number];

export const APP_ACTIONS = ['create', 'read', 'update', 'delete', 'publish', 'export'] as const;
export type AppAction = (typeof APP_ACTIONS)[number] | 'resendMail';

export const WEBSITE_USERS_MODULE_ACTIONS: AppAction[] = ['read', 'update', 'resendMail'];

const buildPermissionsForRole = (
  modules: readonly AppModule[],
  actionsForModule: Partial<Record<AppModule, readonly AppAction[]>>,
  defaultActions: readonly AppAction[],
): PermissionKey[] =>
  modules.flatMap((module) => {
    const moduleActions = actionsForModule[module] ?? defaultActions;
    return moduleActions.map((action) => `${module}:${action}` as PermissionKey);
  });

export type PermissionKey = `${AppModule}:${AppAction}`;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  SUPER_ADMIN: buildPermissionsForRole(
    APP_MODULES,
    {
      'website-users': ['create', 'read', 'update', 'delete', 'resendMail', 'publish', 'export'],
    },
    APP_ACTIONS,
  ),
  ADMIN: buildPermissionsForRole(
    APP_MODULES,
    {
      'website-users': WEBSITE_USERS_MODULE_ACTIONS,
    },
    ['create', 'read', 'update', 'publish'],
  ),
  MANAGER: buildPermissionsForRole(
    APP_MODULES,
    {
      'website-users': WEBSITE_USERS_MODULE_ACTIONS,
    },
    ['read', 'update', 'publish'],
  ),
  SALES_EXEC: [
    'tours:read',
    'tours:create',
    'speciality-tours:read',
    'speciality-tours:create',
    'customers:read',
    'customers:create',
    'crm:read',
    'crm:update',
  ],
  VIEWER: buildPermissionsForRole(
    APP_MODULES,
    {
      'website-users': ['read'],
    },
    ['read'],
  ),
};
