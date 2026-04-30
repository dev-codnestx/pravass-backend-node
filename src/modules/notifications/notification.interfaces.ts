import { Document, Model, Types } from 'mongoose';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

export type NotificationTarget = 'internal' | 'external';
export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'completed';

export interface INotification extends Document {
  title: string;
  message: string;
  target: NotificationTarget;
  data?: Record<string, unknown>;
  status: NotificationStatus;
  scheduledFor: Date;
  expiresAt?: Date;
  sentAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type INotificationDoc = INotification;

export interface INotificationModel extends Model<INotificationDoc> {
  paginate(filter: Record<string, unknown>, options: PaginateOptions): Promise<QueryResult<INotificationDoc>>;
}

export interface IDeviceToken extends Document {
  userId: Types.ObjectId;
  token: string;
  clientType: 'website' | 'admin';
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IDeviceTokenDoc = IDeviceToken;

export interface IDeviceTokenModel extends Model<IDeviceTokenDoc> {
  paginate(filter: Record<string, unknown>, options: PaginateOptions): Promise<QueryResult<IDeviceTokenDoc>>;
}
