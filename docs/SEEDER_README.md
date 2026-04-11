# Database Seeder

This directory contains database seeding scripts for the travel platform backend.

## Available Seeders

### Role Seeder

Creates default roles with predefined permissions:

- **SUPER_ADMIN**: Full access to all modules and actions
- **ADMIN**: Create, read, update, publish access to all modules
- **MANAGER**: Read, update, publish access to all modules
- **SALES_EXEC**: Limited access to tours, customers, and CRM
- **VIEWER**: Read-only access to all modules

### User Seeder

Creates admin users:

- **Super Admin**: `admin@pravass.com` (password from env or default)
- **Demo Users**: Various roles for testing (password from env or default)

## Usage

### Development Environment

```bash
npm run seed
```

### Production Environment

```bash
npm run seed:prod
```

## Environment Variables

### Super Admin Credentials

```bash
SUPER_ADMIN_PASSWORD=YourSecurePassword123
```

### Demo User Credentials

```bash
DEMO_USER_PASSWORD=DemoPassword123
```

If not provided, default passwords will be used:

- Super Admin: `Admin@123456`
- Demo Users: `Demo@123456`

## Database Connection

The seeder uses the same database configuration as the main application. Ensure your MongoDB connection is properly configured in the environment variables.

## What Gets Seeded

1. **Roles** (if not exist)
   - Creates system roles with predefined permissions
   - Updates existing roles with current permission set

2. **Super Admin User** (if not exist)
   - Email: `admin@pravass.com`
   - Role: SUPER_ADMIN
   - Status: Active
   - Must change password on first login

3. **Demo Users** (if not exist)
   - `admin@demo.com` - ADMIN role
   - `manager@demo.com` - MANAGER role
   - `sales@demo.com` - SALES_EXEC role
   - `viewer@demo.com` - VIEWER role

## Security Notes

⚠️ **Important**:

- Change the default passwords immediately after first login
- The super admin user has full system access
- Demo users are for development/testing only
- Consider removing demo users in production

## Running Seeder

The seeder can be run multiple times safely:

- Existing roles are updated with current permissions
- Existing users are not overwritten (except role updates)
- No duplicate data is created

## Clean Seeding (Optional)

To clear all data before seeding, uncomment the `clearDatabase()` call in `src/seeders/index.ts`.

**Warning**: This will delete all existing users, roles, sessions, and OTPs!

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB connection string in environment variables
   - Ensure MongoDB is running and accessible

2. **Permission Denied**
   - Check database user permissions
   - Verify authSource in connection string

3. **Role Not Found**
   - Ensure role seeder runs before user seeder
   - Check for database connection issues

### Logs

The seeder provides detailed console output:

- 🚀 Starting database seeding...
- 🌱 Seeding roles...
- ✅ Created role: SUPER_ADMIN
- 🌱 Seeding super admin user...
- ✅ Created super admin user: admin@pravass.com
- 🔑 Default password: Admin@123456
- ⚠️ Please change default password after first login!
- ✅ Database seeding completed successfully!
