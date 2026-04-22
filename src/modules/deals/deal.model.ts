import { Schema, model } from 'mongoose';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';
import { IDealDoc, IDealModel } from './deal.interfaces.js';
import { DEAL_STATUSES, DEAL_TYPES } from './deal.constants.js';

const dealSchema = new Schema<IDealDoc, IDealModel>(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: DEAL_TYPES,
    },
    value: { type: String, required: true, trim: true },
    tourIds: [{ type: Schema.Types.ObjectId, ref: 'Tour' }],
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: {
      type: String,
      enum: DEAL_STATUSES,
      default: 'Scheduled',
    },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

dealSchema.plugin(toJSON);
dealSchema.plugin(paginate);

export const DealModel = model<IDealDoc, IDealModel>('Deal', dealSchema);
export default DealModel;
