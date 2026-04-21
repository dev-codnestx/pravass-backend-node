import { Document, Model, Types } from 'mongoose';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import { DealStatus, DealType } from './deal.constants.js';

export interface IDeal {
  title: string;
  type: DealType;
  value: string;
  tourIds: Types.ObjectId[];
  start: Date;
  end: Date;
  status: DealStatus;
  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDealDoc extends IDeal, Document {}

export interface IDealModel extends Model<IDealDoc> {
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult<IDealDoc>>;
}
