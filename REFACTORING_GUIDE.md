# Code Refactoring Guide

## 🎯 Objectives

1. **Move logic to model level** - Handle password and other operations at model layer
2. **Create common utilities** - Reusable functions across modules  
3. **Organize routes by platform** - Panel, Website, App routes without redundancy
4. **Optimize and generic** - Efficient, reusable code structure

## 📁 Proposed Structure

### 1. Common Utilities (`src/shared/utils/common/`)

#### `auth.utils.ts` - Authentication utilities
```typescript
// Password hashing, token generation, OTP, validation
export const hashPassword = async (password: string): Promise<string>
export const comparePassword = async (password: string, hash: string): Promise<boolean>
export const generateAccessToken = (payload: JWTPayload): string
export const generateRefreshTokenString = (): string
export const generateOTPCode = (): string
export const validatePasswordStrength = (password: string): ValidationResult
```

#### `model.utils.ts` - Model-level utilities
```typescript
// Common model methods and middleware
export const passwordHashingMiddleware = function(next: any)
export const comparePasswordMethod = async function(candidatePassword: string)
export const incrementFailedAttempts = async function(maxAttempts: number)
export const generateOTP = async function(channel, purpose, OtpModel)
export const verifyOTP = async function(channel, purpose, code, OtpModel)
```

### 2. Enhanced Models with Model-Level Logic

#### User Model (`src/modules/users/user.model.ts`)
```typescript
// Model-level methods instead of service layer
userSchema.methods.isPasswordMatch = comparePasswordMethod
userSchema.methods.incrementFailedAttempts = incrementFailedAttempts
userSchema.methods.resetFailedAttempts = resetFailedAttempts
userSchema.methods.generateOTP = generateOTP
userSchema.methods.verifyOTP = verifyOTP

// Static methods for common queries
userSchema.statics.findByEmail = function(email: string)
userSchema.statics.findActiveUsers = function()
userSchema.statics.findByRole = function(roleId: string)

// Query helpers
userSchema.query.byStatus = function(status: string)
userSchema.query.byRole = function(roleId: string)
userSchema.query.active = function()
```

### 3. Platform-Based Route Organization

#### Main Routes Structure
```
src/routes/
├── index.ts              # Main router
├── panel/
│   ├── index.ts          # Panel routes index
│   ├── auth.routes.ts    # Panel authentication
│   ├── users.routes.ts   # Panel user management
│   ├── roles.routes.ts   # Panel role management
│   └── dashboard.routes.ts # Panel dashboard
├── website/
│   ├── index.ts          # Website routes index
│   ├── auth.routes.ts    # Website authentication
│   ├── tours.routes.ts   # Public tour listings
│   └── booking.routes.ts # Website booking
└── app/
    ├── index.ts          # App routes index
    ├── auth.routes.ts    # App authentication
    ├── tours.routes.ts   # App tour features
    └── profile.routes.ts # App user profile
```

#### Route Prefix Strategy
```typescript
// Panel routes: /api/v1/panel/*
router.use('/panel', panelRoutes)

// Website routes: /api/v1/website/*  
router.use('/website', websiteRoutes)

// App routes: /api/v1/app/*
router.use('/app', appRoutes)
```

### 4. Generic Service Layer

#### Base Service (`src/shared/services/base.service.ts`)
```typescript
export class BaseService<T> {
  constructor(private model: Model<T>) {}

  async create(data: Partial<T>): Promise<T>
  async findById(id: string): Promise<T | null>
  async findOne(filters: any): Promise<T | null>
  async findMany(filters: any, options?: any): Promise<T[]>
  async update(id: string, data: Partial<T>): Promise<T | null>
  async delete(id: string): Promise<boolean>
  async paginate(page: number, limit: number, filters?: any)
}
```

#### Auth Service (`src/modules/auth/auth.service.ts`)
```typescript
export class AuthService {
  // Focus on business logic, not data operations
  async login(credentials: LoginCredentials): Promise<AuthResponse>
  async refreshToken(refreshToken: string): Promise<TokenPair>
  async logout(refreshToken: string): Promise<void>
  async forgotPassword(email: string): Promise<void>
  async resetPassword(resetData: ResetPasswordData): Promise<void>
}
```

## 🔧 Implementation Steps

### Phase 1: Common Utilities
1. ✅ Create `auth.utils.ts` with authentication utilities
2. ✅ Create `model.utils.ts` with model-level methods
3. ✅ Add password hashing middleware
4. ✅ Add OTP generation/verification methods

### Phase 2: Model Refactoring
1. ✅ Update User model with model-level methods
2. ✅ Add static methods for common queries
3. ✅ Add query helpers for filtering
4. ✅ Add virtual properties for computed fields

### Phase 3: Route Organization
1. 🔄 Create platform-based route folders
2. 🔄 Move auth routes to respective platforms
3. 🔄 Add route prefixes for platform separation
4. 🔄 Ensure no redundancy between platforms

### Phase 4: Service Layer Optimization
1. 🔄 Create base service class
2. 🔄 Refactor existing services to use base
3. 🔄 Keep only business logic in services
4. 🔄 Move data operations to models

## 📊 Benefits

### 1. Model-Level Logic
- **Better encapsulation**: Data operations stay with data models
- **Reusability**: Same methods work across different contexts
- **Performance**: Direct model access without service layer overhead
- **Consistency**: Standardized methods across all models

### 2. Common Utilities
- **DRY principle**: No code duplication
- **Testing**: Easier to test utility functions
- **Maintenance**: Single place for updates
- **Type safety**: Proper TypeScript interfaces

### 3. Platform-Based Routes
- **Clear separation**: Each platform has its own routes
- **No redundancy**: Shared logic in common utilities
- **Scalability**: Easy to add new platforms
- **Organization**: Logical route structure

### 4. Generic Services
- **Consistency**: Standard CRUD operations
- **Flexibility**: Easy to extend and customize
- **Maintainability**: Less boilerplate code
- **Performance**: Optimized database operations

## 🔄 Migration Strategy

### 1. Backward Compatibility
- Keep existing routes working during migration
- Gradually move functionality to new structure
- Provide deprecation warnings for old routes

### 2. Testing Strategy
- Unit tests for utility functions
- Integration tests for model methods
- API tests for route endpoints
- Performance tests for critical paths

### 3. Documentation
- Update API documentation
- Create usage examples
- Document migration steps
- Provide troubleshooting guide

## 🚀 Next Actions

1. **Complete Route Organization**
   - Create platform route folders
   - Move existing routes to appropriate platforms
   - Update main router with platform prefixes

2. **Implement Generic Services**
   - Create base service class
   - Refactor existing services
   - Add type safety and error handling

3. **Add Website/App Routes**
   - Create website authentication routes
   - Create app authentication routes
   - Add platform-specific features

4. **Testing & Validation**
   - Write comprehensive tests
   - Validate performance improvements
   - Ensure backward compatibility

## 📝 Example Usage

### Model-Level Operations
```typescript
// Instead of service layer
const user = await userService.login(email, password);

// Use model directly
const user = await UserModel.findByEmail(email);
if (user && await user.isPasswordMatch(password)) {
  await user.resetFailedAttempts();
  // Generate tokens...
}
```

### Common Utilities
```typescript
// Password validation
const validation = validatePasswordStrength(password);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}

// Token generation
const token = generateAccessToken({
  sub: user.id,
  typ: 'user',
  role: user.role.code
});
```

### Platform Routes
```typescript
// Panel: /api/v1/panel/auth/login
// Website: /api/v1/website/auth/login  
// App: /api/v1/app/auth/login
```

This refactoring approach provides a clean, maintainable, and scalable architecture while following your requirements for model-level logic and platform-based route organization.
