import { RoleModel } from '../modules/roles/role.model.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../modules/permissions/permission.constants.js';

type RolePermission = {
  module: string;
  actions: string[];
};

const toRolePermissions = (permissionKeys: string[]): RolePermission[] => {
  const permissionsMap = new Map<string, Set<string>>();

  permissionKeys.forEach((permissionKey) => {
    const [module, action] = String(permissionKey).split(':');
    if (!module || !action) return;

    if (!permissionsMap.has(module)) permissionsMap.set(module, new Set<string>());
    permissionsMap.get(module)!.add(action);
  });

  return Array.from(permissionsMap.entries()).map(([module, actions]) => ({
    module,
    actions: Array.from(actions),
  }));
};

const mergePermissions = (existing: RolePermission[] = [], incoming: RolePermission[] = []): RolePermission[] => {
  const permissionsMap = new Map<string, Set<string>>();

  [...existing, ...incoming].forEach((permission) => {
    const module = String(permission?.module ?? '').trim();
    if (!module) return;

    if (!permissionsMap.has(module)) permissionsMap.set(module, new Set<string>());
    const actions = permissionsMap.get(module)!;

    (permission?.actions ?? []).forEach((action) => {
      const normalizedAction = String(action ?? '').trim();
      if (normalizedAction) actions.add(normalizedAction);
    });
  });

  return Array.from(permissionsMap.entries()).map(([module, actions]) => ({
    module,
    actions: Array.from(actions),
  }));
};

/**
 * Seed default roles.
 */
export const seedRoles = async (): Promise<void> => {
  console.info('🌱 Seeding roles...');

  const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS).map((code) => ({
    name: code.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    code,
    description: `${code.replace('_', ' ')} role`,
    permissions: toRolePermissions(DEFAULT_ROLE_PERMISSIONS[code] ?? []),
    isSystem: true,
    status: 'active' as const,
  }));

  const existingRoles = await RoleModel.find({
    code: { $in: roles.map((role) => role.code) },
  }).select('code permissions');

  const existingRoleCodes = new Set(existingRoles.map((role) => role.code));

  await Promise.all(
    roles.map(async (roleData) => {
      const existingRole = existingRoles.find((role) => role.code === roleData.code);

      if (!existingRoleCodes.has(roleData.code)) {
        await RoleModel.create(roleData);
        console.info(`✅ Created role: ${roleData.name}`);
        return;
      }

      await RoleModel.updateOne(
        { code: roleData.code },
        {
          $set: {
            description: roleData.description,
            // Preserve existing custom permissions and append any newly introduced defaults.
            permissions: mergePermissions(existingRole?.permissions, roleData.permissions),
          },
        },
      );
      console.info(`🔄 Updated role: ${roleData.name}`);
    }),
  );

  console.info('✅ Roles seeding completed');
};
