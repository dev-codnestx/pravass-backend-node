# Postman Collection Guide

## 📋 Overview

This Postman collection contains all the authentication and user management endpoints for the Travel Platform API. It's designed to work seamlessly with the implemented auth system.

## 🚀 Quick Start

### 1. Import Collection & Environment

1. **Import Collection**:
   - Open Postman
   - Click "Import" → "Link"
   - Paste the path to `postman-collection.json`
   - Select collection and click "Import"

2. **Import Environment**:
   - Click "Import" → "Link"
   - Paste the path to `postman-environment.json`
   - Select environment and click "Import"

3. **Select Environment**:
   - In the top-right dropdown, select "Travel Platform - Development"
   - Update `base_url` if your server runs on a different port

### 2. Run Database Seeder

Before testing, make sure your database has the required data:

```bash
npm run seed
```

This will create:

- Super Admin: `admin@pravass.com` / `Admin@123456`
- Demo users for each role

## 🔐 Authentication Flow

### Step 1: Panel Login

**Request**: `POST /auth/panel/login`

```json
{
  "email": "admin@pravass.com",
  "password": "Admin@123456"
}
```

**What happens**:

- Returns access token and refresh token
- Automatically stores tokens in environment variables
- Sets up `bearer_token` for subsequent requests
- Stores user information (email, role)

**Test Results**:

- ✅ Login successful (200)
- ❌ Login failed (400/401/403)

### Step 2: Get Current User

**Request**: `GET /auth/me` (with Authorization header)

**What happens**:

- Uses the stored `bearer_token`
- Returns user profile with role and permissions
- Validates that authentication is working

### Step 3: Token Refresh (Automatic)

The collection includes automatic token refresh logic:

- Checks if token expires within 5 minutes
- Automatically refreshes using refresh token
- Updates environment variables with new token

## 📱 Available Endpoints

### Authentication Endpoints

| Method | Endpoint                | Description              | Auth Required |
| ------ | ----------------------- | ------------------------ | ------------- |
| POST   | `/auth/panel/login`     | Login to admin panel     | ❌            |
| GET    | `/auth/me`              | Get current user profile | ✅            |
| POST   | `/auth/refresh`         | Refresh access token     | ❌            |
| POST   | `/auth/logout`          | Logout current session   | ❌            |
| POST   | `/auth/logout-all`      | Logout all devices       | ✅            |
| POST   | `/auth/forgot-password` | Send password reset OTP  | ❌            |
| POST   | `/auth/reset-password`  | Reset password with OTP  | ❌            |

### User Management Endpoints

| Method | Endpoint      | Description              | Auth Required |
| ------ | ------------- | ------------------------ | ------------- |
| GET    | `/users`      | Get paginated users list | ✅            |
| POST   | `/users`      | Create new user          | ✅            |
| GET    | `/users/{id}` | Get user by ID           | ✅            |
| PATCH  | `/users/{id}` | Update user              | ✅            |
| DELETE | `/users/{id}` | Delete user              | ✅            |

## 🔧 Password Reset Flow

### Step 1: Request OTP

**Request**: `POST /auth/forgot-password`

```json
{
  "email": "admin@pravass.com"
}
```

**Response**: Success message (even if email doesn't exist for security)

### Step 2: Reset Password

**Request**: `POST /auth/reset-password`

```json
{
  "email": "admin@pravass.com",
  "otp": "123456",
  "newPassword": "NewPassword@123"
}
```

**Note**: For development, OTP is printed in console logs. In production, it would be sent via email.

## 🧪 Testing Scenarios

### Scenario 1: Successful Login Flow

1. **Panel Login** → Get tokens
2. **Get Current User** → Verify authentication
3. **Get All Users** → Test permissions
4. **Logout** → Clear tokens

### Scenario 2: Token Refresh

1. **Panel Login** → Get tokens
2. **Wait 5+ minutes** (or modify token expiration)
3. **Get Current User** → Should auto-refresh token
4. **Verify new token** in environment variables

### Scenario 3: Password Reset

1. **Forgot Password** → Request OTP
2. **Check console** for OTP (development only)
3. **Reset Password** → Use OTP to reset
4. **Login** with new password

### Scenario 4: Permission Testing

Test with different user roles:

1. **Super Admin** (`admin@pravass.com`):
   - Full access to all endpoints

2. **Admin** (`admin@demo.com`):
   - Most permissions except delete

3. **Manager** (`manager@demo.com`):
   - Read, update, publish permissions

4. **Sales Exec** (`sales@demo.com`):
   - Limited to tours, customers, CRM

5. **Viewer** (`viewer@demo.com`):
   - Read-only access

## 🛠️ Environment Variables

| Variable        | Type   | Description                                     |
| --------------- | ------ | ----------------------------------------------- |
| `base_url`      | string | API server URL (default: http://localhost:3000) |
| `access_token`  | secret | JWT access token                                |
| `refresh_token` | secret | Refresh token for token rotation                |
| `bearer_token`  | secret | "Bearer " + access_token                        |
| `user_email`    | string | Current authenticated user email                |
| `user_role`     | string | Current authenticated user role                 |
| `user_id`       | string | User ID for user operations                     |
| `role_id`       | string | Role ID for user creation                       |

## 🔍 Test Scripts

Each request includes test scripts that:

1. **Validate Responses**: Check status codes and response structure
2. **Manage Tokens**: Store/update authentication tokens
3. **Auto-refresh**: Refresh tokens before expiration
4. **Debug Logging**: Log response details for troubleshooting

## 📝 Sample Test Results

### Successful Login Test

```javascript
pm.test('Login successful', () => {
  pm.expect(pm.response.code).to.eql(200);
  pm.expect(response.success).to.be.true;
  pm.expect(response.data).to.have.property('user');
  pm.expect(response.data).to.have.property('tokens');
});
```

### Token Management

```javascript
if (response.data && response.data.tokens) {
  pm.environment.set('access_token', response.data.tokens.accessToken);
  pm.environment.set('refresh_token', response.data.tokens.refreshToken);
  pm.collectionVariables.set('bearer_token', 'Bearer ' + response.data.tokens.accessToken);
}
```

## 🚨 Troubleshooting

### Common Issues

1. **401 Unauthorized**:
   - Check if tokens are stored in environment
   - Try logging in again
   - Verify `base_url` is correct

2. **403 Forbidden**:
   - User doesn't have required permissions
   - Try with a higher-privileged user (Super Admin)

3. **Token Expired**:
   - Collection should auto-refresh
   - If not, manually run "Refresh Access Token"

4. **OTP Not Working**:
   - Check console logs for OTP (development)
   - Ensure email is registered in database
   - OTP expires after 10 minutes

### Debug Tips

1. **Check Console**: Postman console shows detailed logs
2. **View Environment**: Verify tokens are stored correctly
3. **Test Response**: Check actual API response structure
4. **Network Tab**: Verify request headers and body

## 🔄 Customization

### Update Base URL

1. Go to Environment variables
2. Edit `base_url` to match your server
3. Save changes

### Add Custom Tests

1. Select a request
2. Go to "Tests" tab
3. Add custom JavaScript tests
4. Save collection

### Modify Request Bodies

1. Select a request
2. Go to "Body" tab
3. Edit JSON as needed
4. Save changes

## 📚 API Documentation

For detailed API documentation, refer to:

- Swagger/OpenAPI specs (when implemented)
- Code comments in controller files
- Response examples in test scripts

## 🎯 Best Practices

1. **Use Collection**: Don't send requests individually
2. **Check Tests**: Verify all tests pass
3. **Monitor Tokens**: Ensure tokens are properly managed
4. **Test Permissions**: Verify role-based access
5. **Clean Logout**: Always logout after testing
6. **Reset Environment**: Clear tokens between test runs

## 📞 Support

If you encounter issues:

1. Check the console logs in Postman
2. Verify server is running and accessible
3. Ensure database is seeded with required data
4. Check environment variables are correct
5. Review the test scripts for validation logic

Happy testing! 🚀
