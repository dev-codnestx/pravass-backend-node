import mongoose, { Model, Types } from 'mongoose';

import { AccessAndRefreshTokens } from '@/modules/token/token.interfaces.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

import type { IUser as IUserDoc } from './user.model.js';

export type { IUserDoc };

export interface IUser {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  roleId: Types.ObjectId;
  status: 'active' | 'inactive' | 'locked';
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  refreshTokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUserDoc> {
  isEmailTaken(email: string, excludeUserId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, unknown>, options: PaginateOptions): Promise<QueryResult<IUserDoc>>;
}

export interface NewUserBody {
  email: string;
  password: string;
  name?: string;
  fullName?: string;
  phone?: string;
  roleId?: Types.ObjectId;
  status?: IUser['status'];
  isEmailVerified?: boolean;
  mustChangePassword?: boolean;
  twoFactorEnabled?: boolean;
  refreshTokenVersion?: number;
}

export interface UpdateUserBody {
  email?: string;
  password?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  roleId?: Types.ObjectId;
  status?: IUser['status'];
  isEmailVerified?: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts?: number;
  mustChangePassword?: boolean;
  twoFactorEnabled?: boolean;
  refreshTokenVersion?: number;
}

export type NewRegisteredUser = NewUserBody;
export type NewCreatedUser = NewUserBody;

export interface IUserWithTokens {
  user: IUserDoc;
  tokens: AccessAndRefreshTokens;
}
