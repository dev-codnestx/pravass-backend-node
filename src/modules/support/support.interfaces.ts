import { Document, Model, Types } from 'mongoose';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import { TicketStatus, TicketPriority, MessageFrom } from './support.constants.js';

export interface IMessage {
  from: MessageFrom;
  name: string;
  message: string;
  time: Date;
}

export interface ISupport {
  ticketId: string; // TKT-XXXX
  subject: string;
  category?: string;
  customer: Types.ObjectId; // Reference to User
  customerName: string; // Denormalized for easy display
  priority: TicketPriority;
  status: TicketStatus;
  message: string; // Initial user request
  reply?: IMessage; // Single admin reply
  internalNotes: string[];
  attachments?: string[];
  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISupportDoc extends ISupport, Document {}

export interface ISupportModel extends Model<ISupportDoc> {
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult<ISupportDoc>>;
}
