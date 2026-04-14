import { Schema, model, Types } from 'mongoose';
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
import { IUser, IUserModel } from './user.interfaces.js';

const LEGACY_USER_EMAIL_FIELD = 'user_email' as const;

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    birthdate: { type: String, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      set: (val: string) => val.toLowerCase().trim(),
    },
    phoneNumber: { type: String, trim: true },
    dialCode: { type: Number, default: 91 },
    isNewUser: { type: Boolean, default: false },
    userType: { type: String, trim: true },
    passwordHash: { type: String, select: false },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', index: true },
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
    profileImage: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, ret) => sanitizeUser(ret) },
  },
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: 'string', $ne: '' },
    },
  },
);

userSchema.plugin(toJSON);
userSchema.plugin(paginate as any);

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
  const user = await this.findOne({
    $or: [{ email }, { [LEGACY_USER_EMAIL_FIELD]: email }],
    _id: { $ne: excludeUserId },
  });
  return !!user;
};

userSchema.statics.isMobileNumberTaken = async function (mobileNumber: string, excludeUserId?: Types.ObjectId) {
  const user = await this.findOne({
    $or: [{ phoneNumber: mobileNumber }, { phone: mobileNumber }],
    _id: { $ne: excludeUserId },
  });
  return !!user;
};

export const UserModel = model<IUser, IUserModel>('User', userSchema);
export default UserModel;
