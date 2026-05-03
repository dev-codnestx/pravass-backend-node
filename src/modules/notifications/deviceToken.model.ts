import { Schema, model } from 'mongoose';
import { toJSON, paginate } from '@/shared/utils/plugins/index.js';
import { IDeviceToken, IDeviceTokenModel } from './notification.interfaces.js';

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    token: { type: String, required: true, unique: true, trim: true },
    clientType: { type: String, enum: ['website', 'admin'], required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

deviceTokenSchema.plugin(toJSON);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
deviceTokenSchema.plugin(paginate as any);

export const DeviceTokenModel = model<IDeviceToken, IDeviceTokenModel>('DeviceToken', deviceTokenSchema);
export default DeviceTokenModel;
