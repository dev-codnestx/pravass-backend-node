import { UserModel } from '../modules/user/user.model.js';
import { RoleModel } from '../modules/roles/role.model.js';

const SUPER_ADMIN_EMAIL = 'admin@pravass.com';
const SUPER_ADMIN_USER_TYPE = 'superadmin';
const SUPER_ADMIN_PROFILE = {
  fullName: 'Super Administrator',
  phoneNumber: '+1234567890',
  userType: SUPER_ADMIN_USER_TYPE,
  status: 'active' as const,
  isEmailVerified: true,
  failedLoginAttempts: 0,
  mustChangePassword: true,
  twoFactorEnabled: false,
  refreshTokenVersion: 0,
};

/**
 * Seed super admin user
 */
export const seedSuperAdmin = async (): Promise<void> => {
  console.info('🌱 Seeding super admin user...');

  const superAdminRole = await RoleModel.findOne({ code: 'SUPER_ADMIN' });
  if (!superAdminRole) throw new Error('SUPER_ADMIN role not found. Please run role seeder first.');

  const existingSuperAdmin = await UserModel.findOne({ email: SUPER_ADMIN_EMAIL });

  if (!existingSuperAdmin) {
    const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';

    const superAdmin = await UserModel.create({
      ...SUPER_ADMIN_PROFILE,
      email: SUPER_ADMIN_EMAIL,
      passwordHash: defaultPassword,
      roleId: superAdminRole._id,
    });

    console.info(`✅ Created super admin user: ${superAdmin.email}`);
    console.info(`🔑 Default password: ${defaultPassword}`);
    console.info('⚠️  Please change the default password after first login!');
  } else {
    // Keep SUPER_ADMIN profile aligned with latest seeded keys (including userType).
    await UserModel.updateOne(
      { email: SUPER_ADMIN_EMAIL },
      {
        $set: {
          ...SUPER_ADMIN_PROFILE,
          roleId: superAdminRole._id,
        },
      },
    );
    console.info('🔄 Updated super admin user');
  }

  console.info('✅ Super admin seeding completed');
};

/**
 * Seed demo users for different roles
 */
export const seedDemoUsers = async (): Promise<void> => {
  console.info('🌱 Seeding demo users...');

  const demoUsers = [
    {
      email: 'admin@demo.com',
      fullName: 'Demo Admin',
      roleCode: 'ADMIN',
      phone: '+1234567891',
    },
    {
      email: 'manager@demo.com',
      fullName: 'Demo Manager',
      roleCode: 'MANAGER',
      phone: '+1234567892',
    },
    {
      email: 'sales@demo.com',
      fullName: 'Demo Sales Executive',
      roleCode: 'SALES_EXEC',
      phone: '+1234567893',
    },
    {
      email: 'viewer@demo.com',
      fullName: 'Demo Viewer',
      roleCode: 'VIEWER',
      phone: '+1234567894',
    },
  ];

  const defaultPassword = process.env.DEMO_USER_PASSWORD || 'Demo@123456';

  const [existingUsers, roles] = await Promise.all([
    UserModel.find({ email: { $in: demoUsers.map((user) => user.email) } }).select('email'),
    RoleModel.find({ code: { $in: demoUsers.map((user) => user.roleCode) } }).select('_id code'),
  ]);

  const existingUserEmails = new Set(existingUsers.map((user) => user.email));
  const roleByCode = new Map(roles.map((role) => [role.code, role]));

  await Promise.all(
    demoUsers.map(async (userData) => {
      if (existingUserEmails.has(userData.email)) {
        console.info(`ℹ️  Demo user already exists: ${userData.email}`);
        return;
      }

      const role = roleByCode.get(userData.roleCode);
      if (!role) {
        console.warn(`⚠️  Role ${userData.roleCode} not found, skipping user ${userData.email}`);
        return;
      }

      await UserModel.create({
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        passwordHash: defaultPassword,
        roleId: role._id,
        status: 'active',
        isEmailVerified: true,
        failedLoginAttempts: 0,
        mustChangePassword: false,
        twoFactorEnabled: false,
        refreshTokenVersion: 0,
      });

      console.info(`✅ Created demo user: ${userData.email} (${userData.roleCode})`);
    }),
  );

  console.info(`🔑 Demo users password: ${defaultPassword}`);
  console.info('✅ Demo users seeding completed');
};
