import { Schema, model } from 'mongoose';
import { toJSON, paginate } from '@/shared/utils/plugins/index.js';
import { INotification, INotificationModel } from './notification.interfaces.js';

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    target: { type: String, enum: ['internal', 'external'], required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    scheduledFor: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, index: true },
    sentAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  },
);

notificationSchema.plugin(toJSON);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
notificationSchema.plugin(paginate as any);

export const NotificationModel = model<INotification, INotificationModel>('Notification', notificationSchema);
export default NotificationModel;
