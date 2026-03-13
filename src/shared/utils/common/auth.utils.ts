import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import config from '@/shared/config/config.js';

/**
 * Common authentication utilities that can be used across modules
 */

export interface JWTPayload {
  sub: string;
  typ: 'user' | 'customer';
  role?: string;
  permissionsVersion?: number;
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => bcrypt.hash(password, 12);

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash);

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const fullPayload: JWTPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + config.jwt.accessExpirationMinutes * 60,
  };

  return jwt.sign(fullPayload, config.jwt.secret, { algorithm: 'HS256' });
};

/**
 * Generate refresh token string
 */
export const generateRefreshTokenString = (): string => crypto.randomBytes(32).toString('hex');

/**
 * Hash refresh token for storage
 */
export const hashRefreshToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Generate OTP code
 */
export const generateOTPCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Hash OTP code for storage
 */
export const hashOTPCode = (code: string): string => crypto.createHash('sha256').update(code).digest('hex');

/**
 * Verify JWT token
 */
export const verifyJWTToken = (token: string): JWTPayload => jwt.verify(token, config.jwt.secret) as JWTPayload;

/**
 * Extract user type from JWT payload
 */
export const getUserTypeFromToken = (token: string): 'user' | 'customer' | null => {
  try {
    const payload = verifyJWTToken(token);
    return payload.typ;
  } catch {
    return null;
  }
};

/**
 * Check if user has required role
 */
export const hasRole = (userRole: string, requiredRoles: string[]): boolean => requiredRoles.includes(userRole);

/**
 * Check if user has required permission
 */
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean =>
  userPermissions.includes(requiredPermission);

/**
 * Generate permission key from module and action
 */
export const createPermissionKey = (module: string, action: string): string => `${module}:${action}`;

/**
 * Parse permission key into module and action
 */
export const parsePermissionKey = (permission: string): { module: string; action: string } => {
  const [module, action] = permission.split(':');
  return { module, action };
};

/**
 * Flatten role permissions into permission keys
 */
export const flattenPermissions = (rolePermissions: Array<{ module: string; actions: string[] }>): string[] =>
  rolePermissions.flatMap((p) => p.actions.map((action) => createPermissionKey(p.module, action)));

/**
 * Generate session expiry date
 */
export const getSessionExpiry = (): Date => new Date(Date.now() + config.jwt.refreshExpirationDays * 24 * 60 * 60 * 1000);

/**
 * Generate OTP expiry date (10 minutes)
 */
export const getOTPExpiry = (): Date => new Date(Date.now() + 10 * 60 * 1000);

/**
 * Sanitize user data for response (remove sensitive fields)
 */
export const sanitizeUser = <T extends Record<string, unknown>>(
  user: T,
  excludeFields: string[] = ['passwordHash'],
): Omit<T, (typeof excludeFields)[number]> => {
  const sanitized = { ...user };
  excludeFields.forEach((field) => delete sanitized[field]);
  return sanitized;
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) errors.push('Password must be at least 8 characters long');

  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');

  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');

  if (!/\d/.test(password)) errors.push('Password must contain at least one number');

  if (!/[@$!%*?&]/.test(password)) errors.push('Password must contain at least one special character');

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate device fingerprint from request
 */
export const generateDeviceFingerprint = (userAgent?: string, ipAddress?: string): string => {
  const fingerprint = `${userAgent || 'unknown'}_${ipAddress || 'unknown'}_${Date.now()}`;
  return crypto.createHash('md5').update(fingerprint).digest('hex');
};
