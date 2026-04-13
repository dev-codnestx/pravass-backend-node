import { Schema, model } from 'mongoose';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';
import { ISupportDoc, ISupportModel } from './support.interfaces.js';
import { TicketStatus, TicketPriority, MessageFrom } from './support.constants.js';

const messageSchema = new Schema({
  from: {
    type: String,
    enum: Object.values(MessageFrom),
    required: true,
  },
  name: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: Date, default: Date.now },
});

const supportSchema = new Schema<ISupportDoc, ISupportModel>(
  {
    ticketId: { type: String, required: true, unique: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
    },
    message: { type: String, required: true },
    reply: messageSchema,
    internalNotes: [{ type: String }],
    attachments: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

supportSchema.plugin(toJSON);
supportSchema.plugin(paginate);

export const SupportModel = model<ISupportDoc, ISupportModel>('Support', supportSchema);
export default SupportModel;
