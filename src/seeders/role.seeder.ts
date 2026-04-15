import { RoleModel } from '../modules/roles/role.model.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../modules/permissions/permission.constants.js';

/**
 * Seed default roles.
 *
 * Permissions are intentionally left empty here so roles can be created as
 * plain role records and populated separately when needed.
 */
export const seedRoles = async (): Promise<void> => {
  console.info('🌱 Seeding roles...');

  const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS).map((code) => ({
    name: code.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    code,
    description: `${code.replace('_', ' ')} role`,
    permissions: [],
    isSystem: true,
    status: 'active' as const,
  }));

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
            description: roleData.description,
          },
        },
      );
      console.info(`🔄 Updated role: ${roleData.name}`);
    }),
  );

  console.info('✅ Roles seeding completed');
};
