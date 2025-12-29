import { Types } from 'mongoose';

export interface IRole {
  _id?: Types.ObjectId;
  name: string;
  description: string;
  permissions: Types.ObjectId[];
  parentRole?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  company: Types.ObjectId;
}
