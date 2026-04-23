import { Document, Model, Types } from 'mongoose';

import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

export type CustomerStatus = 'active' | 'inactive' | 'locked';

export interface ICustomer {
  fullName: string;
  sourceUserId?: Types.ObjectId;
  email?: string;
  phoneNumber?: string;
  dialCode?: number;
  address?: string;
  birthdate?: string;
  profileImage?: string;
  status: CustomerStatus;
  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICustomerDoc extends ICustomer, Document {}

export interface ICustomerModel extends Model<ICustomerDoc> {
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult<ICustomerDoc>>;
  isEmailTaken(email: string, excludeCustomerId?: Types.ObjectId): Promise<boolean>;
  isMobileNumberTaken(phoneNumber: string, excludeCustomerId?: Types.ObjectId): Promise<boolean>;
}

export interface CreateCustomerBody {
  fullName: string;
  sourceUserId?: Types.ObjectId | string;
  email?: string;
  phoneNumber?: string;
  dialCode?: number;
  status?: CustomerStatus;
  address?: string;
  birthdate?: string;
  profileImage?: string;
}

export interface UpdateCustomerBody {
  fullName?: string;
  sourceUserId?: Types.ObjectId | string;
  email?: string;
  phoneNumber?: string;
  dialCode?: number;
  status?: CustomerStatus;
  address?: string;
  birthdate?: string;
  profileImage?: string;
}

export interface CreateCustomerResult {
  customer: ICustomerDoc;
  created: boolean;
}
