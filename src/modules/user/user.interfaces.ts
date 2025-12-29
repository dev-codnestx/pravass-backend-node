import mongoose, { Model, Document } from 'mongoose';
import { Types } from 'mongoose';

import { AccessAndRefreshTokens } from '@/modules/token/token.interfaces.js';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  phoneNumber: {
    dialCode: number;
    phone: number;
  };
  team: Types.ObjectId[];
  company: {
    id: Types.ObjectId;
    role: Types.ObjectId[];
  };
  subCompany: {
    id: Types.ObjectId;
    role: Types.ObjectId[];
  };
  reportingId: Types.ObjectId;
  joiningDate: Date;
  status: 'active' | 'inActive';
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

export interface IUserDoc extends IUser, Document {
  isPasswordMatch(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDoc> {
  isEmailTaken(email: string, excludeUserId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(
    filter: Record<string, unknown>, //TODO: later specify correct type;
    options: Record<string, unknown>, //TODO: later specify correct type;
  ): Promise<QueryResult>;
}

export type UpdateUserBody = Partial<IUser>;

export type NewRegisteredUser = Omit<IUser, 'isEmailVerified'>;

export type NewCreatedUser = Omit<IUser, 'isEmailVerified'>;

export interface IUserWithTokens {
  user: IUserDoc;
  tokens: AccessAndRefreshTokens;
}
