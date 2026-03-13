import { Schema, model, Document, Types } from 'mongoose';
import {
  passwordHashingMiddleware,
  comparePasswordMethod,
  incrementFailedAttempts,
  resetFailedAttempts,
  generateOTP,
  verifyOTP,
} from '@/shared/utils/common/model.utils.js';
import { sanitizeUser } from '@/shared/utils/common/auth.utils.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';
import { IUserModel } from './user.interfaces.js';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  password?: string;
  name?: string;
  roleId: Types.ObjectId;
  status: 'active' | 'inactive' | 'locked';
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  refreshTokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  isPasswordMatch(candidatePassword: string): Promise<boolean>;
  incrementFailedAttempts(maxAttempts?: number): Promise<boolean>;
  resetFailedAttempts(): Promise<void>;
  generateOTP(channel: 'email' | 'sms', purpose: string, OtpModel: any): Promise<string>;
  verifyOTP(channel: 'email' | 'sms', purpose: string, code: string, OtpModel: any): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true, // Automatically creates index
      lowercase: true,
      trim: true,
      set: (val: string) => val.toLowerCase().trim(),
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'locked'],
      default: 'active',
      index: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    mustChangePassword: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, ret) => sanitizeUser(ret) },
  },
);

userSchema.plugin(toJSON);
userSchema.plugin(paginate);

// Virtuals
userSchema
  .virtual('password')
  .get(function (this: IUser) {
    return this.passwordHash;
  })
  .set(function (this: IUser, value: string) {
    this.passwordHash = value;
  });

// Bind Methods
userSchema.pre('save', passwordHashingMiddleware);
userSchema.methods.isPasswordMatch = comparePasswordMethod;
userSchema.methods.incrementFailedAttempts = incrementFailedAttempts;
userSchema.methods.resetFailedAttempts = resetFailedAttempts;
userSchema.methods.generateOTP = generateOTP;
userSchema.methods.verifyOTP = verifyOTP;

// Statics
userSchema.statics.isEmailTaken = async function (email: string, excludeUserId?: Types.ObjectId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

export const UserModel = model<IUser, IUserModel>('User', userSchema);
export default UserModel;
