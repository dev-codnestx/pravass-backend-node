import { Types } from 'mongoose';

export interface IPermission {
  _id?: Types.ObjectId;
  name: string;
  description: string;
  module: {
    moduleName: string;
    actions: ('create' | 'retrieve' | 'update' | 'delete')[];
  }[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  company: Types.ObjectId;
}
