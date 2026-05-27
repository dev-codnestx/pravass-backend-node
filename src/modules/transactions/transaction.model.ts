import { Document, Model, Schema, Types, model } from 'mongoose';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface ITransaction {
  bookingId: Types.ObjectId;
  userId?: Types.ObjectId;
  transactionRef: string;
  amount: number;
  currency: string;
  gateway: 'RAZORPAY' | 'CASH' | 'BANK_TRANSFER';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  status: TransactionStatus;
  errorMessage?: string;
  metadata?: any;
  notes?: string;
  paidAt?: Date;
}

export interface ITransactionDoc extends ITransaction, Document {}

export interface ITransactionModel extends Model<ITransactionDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<any>;
}

const transactionSchema = new Schema<ITransactionDoc, ITransactionModel>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    transactionRef: { type: String, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    gateway: { type: String, enum: ['RAZORPAY', 'CASH', 'BANK_TRANSFER'], default: 'RAZORPAY' },
    gatewayOrderId: { type: String, trim: true },
    gatewayPaymentId: { type: String, trim: true },
    gatewaySignature: { type: String, trim: true },
    status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.PENDING, index: true },
    errorMessage: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    notes: { type: String, trim: true },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

transactionSchema.index({ createdAt: -1 });

transactionSchema.pre('validate', function generateTransactionRef() {
  if (!this.transactionRef) {
    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.transactionRef = `TRX-${randomSuffix}-${Date.now().toString().slice(-4)}`;
  }
});

transactionSchema.plugin(toJSON);
transactionSchema.plugin(paginate);

export const TransactionModel = model<ITransactionDoc, ITransactionModel>('Transaction', transactionSchema);
export default TransactionModel;
