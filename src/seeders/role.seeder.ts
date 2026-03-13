import { RoleModel } from '../modules/roles/role.model.js';
import { AppAction, AppModule, DEFAULT_ROLE_PERMISSIONS } from '../modules/permissions/permission.constants.js';

/**
 * Seed default roles with permissions
 */
export const seedRoles = async (): Promise<void> => {
  console.info('🌱 Seeding roles...');

  const roles = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([code, permissions]) => {
    // Group permissions by module
    const permissionMap = new Map<AppModule, AppAction[]>();

    permissions.forEach((permission) => {
      const [module, action] = permission.split(':') as [AppModule, AppAction];
      if (!permissionMap.has(module)) permissionMap.set(module, []);

      permissionMap.get(module)!.push(action);
    });

    return {
      name: code.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      code,
      description: `${code.replace('_', ' ')} role with predefined permissions`,
      permissions: Array.from(permissionMap.entries()).map(([module, actions]) => ({
        module,
        actions,
      })),
      isSystem: true,
      status: 'active' as const,
    };
  });

  const existingRoles = await RoleModel.find({
    code: { $in: roles.map((role) => role.code) },
  }).select('code');

  const existingRoleCodes = new Set(existingRoles.map((role) => role.code));

  await Promise.all(
    roles.map(async (roleData) => {
      if (!existingRoleCodes.has(roleData.code)) {
        await RoleModel.create(roleData);
        console.info(`✅ Created role: ${roleData.name}`);
        return;
      }

      await RoleModel.updateOne(
        { code: roleData.code },
        {
          $set: {
            permissions: roleData.permissions,
            description: roleData.description,
          },
        },
      );
      console.info(`🔄 Updated role: ${roleData.name}`);
    }),
  );

  console.info('✅ Roles seeding completed');
};
