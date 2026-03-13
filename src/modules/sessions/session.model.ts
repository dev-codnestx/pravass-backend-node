import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  subjectType: 'user' | 'customer';
  subjectId: Types.ObjectId;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    subjectType: { type: String, enum: ['user', 'customer'], required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    userAgent: String,
    ipAddress: String,
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: Date,
  },
  { timestamps: true },
);

sessionSchema.index({ subjectType: 1, subjectId: 1, revokedAt: 1 });

export const SessionModel = model<ISession>('Session', sessionSchema);
