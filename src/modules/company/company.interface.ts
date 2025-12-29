import { Types } from 'mongoose';

export interface ICompany {
  name: string;
  description: string;
  address: string;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}
