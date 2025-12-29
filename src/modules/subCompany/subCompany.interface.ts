import { Types } from 'mongoose';

export interface ISubCompany {
  name: string;
  description: string;
  address: string;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  company: Types.ObjectId;
}
