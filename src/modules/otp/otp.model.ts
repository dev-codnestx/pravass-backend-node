import { Schema, model } from 'mongoose';
import { IOtpDoc } from '@/modules/otp/otp.interface.js';
import { toJSON } from '@/shared/utils/plugins/index.js';

const otpSchema = new Schema<IOtpDoc>({
  phone: {
    type: Number,
    required: false,
    trim: true,
  },
  phoneNumber: {
    type: Number,
    required: false,
    trim: true,
  },
  dialCode: {
    type: Number,
    required: false,
    trim: true,
    default: 91, // Default to India
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
  },
  orderId: {
    type: String,
    required: true,
    trim: true,
  },
  otp: {
    type: Number,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// add plugin that converts mongoose to json
otpSchema.plugin(toJSON);

export const Otp = model<IOtpDoc>('Otp', otpSchema);
