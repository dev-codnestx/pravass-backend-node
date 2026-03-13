import { Schema, model, Document, Types } from 'mongoose';

export interface IOtp extends Document {
  subjectType: 'user' | 'customer';
  subjectId: Types.ObjectId;
  channel: 'email' | 'sms';
  purpose: 'login' | 'forgot_password' | 'verify_email' | 'verify_phone';
  codeHash: string;
  expiresAt: Date;
  consumedAt?: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    subjectType: { type: String, enum: ['user', 'customer'], required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
    channel: { type: String, enum: ['email', 'sms'], required: true },
    purpose: {
      type: String,
      enum: ['login', 'forgot_password', 'verify_email', 'verify_phone'],
      required: true,
      index: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: Date,
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = model<IOtp>('Otp', otpSchema);
