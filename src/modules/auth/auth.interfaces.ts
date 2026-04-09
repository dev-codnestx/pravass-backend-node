import { IUser } from '../user/user.model.js';
import { IRole } from '../roles/role.model.js';
import { PermissionKey } from '../permissions/permission.constants.js';

export interface JWTPayload {
  sub: string;
  typ: 'user' | 'customer';
  role?: string;
  permissionsVersion?: number;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  user: Omit<IUser, 'passwordHash'>;
  role: IRole;
  tokens: AuthTokens;
}

export interface PermissionCheck {
  module: string;
  action: string;
}

export interface IAuthUser extends Omit<IUser, 'passwordHash'> {
  role: IRole;
  permissions: PermissionKey[];
}
