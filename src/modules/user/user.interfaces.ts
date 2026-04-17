import mongoose, { Document, Model, Types } from 'mongoose';

import { AccessAndRefreshTokens } from '@/modules/token/token.interfaces.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

export interface IUser extends Document {
  fullName: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  dialCode?: number;
  isNewUser?: boolean;
  userType?: string;
  user_email?: string;
  first_name?: string;
  last_name?: string;
  platform_source?: string;
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
  profileImage?: string;
  isPasswordMatch(candidatePassword: string): Promise<boolean>;
  incrementFailedAttempts(maxAttempts?: number): Promise<boolean>;
  resetFailedAttempts(): Promise<void>;
  generateOTP(channel: 'email' | 'sms', purpose: string, OtpModel: any): Promise<string>;
  verifyOTP(channel: 'email' | 'sms', purpose: string, code: string, OtpModel: any): Promise<boolean>;
}

export type IUserDoc = IUser;

export interface IUserModel extends Model<IUserDoc> {
  isEmailTaken(email: string, excludeUserId?: mongoose.Types.ObjectId): Promise<boolean>;
  isMobileNumberTaken(mobileNumber: string, excludeUserId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, unknown>, options: PaginateOptions): Promise<QueryResult<IUserDoc>>;
}

export interface NewUserBody {
  email?: string;
  password: string;
  name?: string;
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  user_email?: string;
  first_name?: string;
  last_name?: string;
  birthdate?: string;
  fullName?: string;
  phone?: string;
  platform_source?: string;
  roleId?: Types.ObjectId;
  status?: IUser['status'];
  isEmailVerified?: boolean;
  userType?: string;
  mustChangePassword?: boolean;
  twoFactorEnabled?: boolean;
  refreshTokenVersion?: number;
}

export interface UpdateUserBody {
  email?: string;
  password?: string;
  name?: string;
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  user_email?: string;
  first_name?: string;
  last_name?: string;
  birthdate?: string;
  fullName?: string;
  phone?: string;
  platform_source?: string;
  roleId?: Types.ObjectId;
  status?: IUser['status'];
  isEmailVerified?: boolean;
  userType?: string;
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

export interface CreateUserResult {
  user: IUserDoc;
  emailSent: boolean;
  emailWarning?: string;
}
