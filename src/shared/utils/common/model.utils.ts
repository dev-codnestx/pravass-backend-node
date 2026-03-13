import { hashPassword, comparePassword, generateOTPCode, hashOTPCode, getOTPExpiry } from './auth.utils.js';

/**
 * Password hashing pre-save middleware
 * Removed 'next' to rely on Promise resolution
 */
export const passwordHashingMiddleware = async function (this: any) {
  // If passwordHash isn't modified, just return
  if (!this.isModified('passwordHash')) return;

  const hashedPassword = await hashPassword(this.passwordHash);
  this.passwordHash = hashedPassword;
};

/**
 * Password comparison method
 */
export const comparePasswordMethod = async function (this: any, candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return comparePassword(candidatePassword, this.passwordHash);
};

/**
 * Increment failed login attempts
 */
export const incrementFailedAttempts = async function (this: any, maxAttempts: number = 5): Promise<boolean> {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;

  if (this.failedLoginAttempts >= maxAttempts) this.status = 'locked';

  await this.save();
  return this.status === 'locked';
};

/**
 * Reset failed login attempts
 */
export const resetFailedAttempts = async function (this: any): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lastLoginAt = new Date();
  await this.save();
};

/**
 * Generate and store OTP
 */
export const generateOTP = async function (
  this: any,
  channel: 'email' | 'sms',
  purpose: string,
  OtpModel: any, // Note: I simplified the args to match your model call
): Promise<string> {
  await OtpModel.updateMany({ subjectId: this._id, purpose, consumedAt: { $exists: false } }, { consumedAt: new Date() });

  const code = generateOTPCode();
  const codeHash = hashOTPCode(code);
  const expiresAt = getOTPExpiry();

  await OtpModel.create({
    subjectId: this._id,
    channel,
    purpose,
    codeHash,
    expiresAt,
  });

  return code;
};

/**
 * Verify OTP
 */
export const verifyOTP = async function (
  this: any,
  channel: 'email' | 'sms',
  purpose: string,
  code: string,
  OtpModel: any,
): Promise<boolean> {
  const codeHash = hashOTPCode(code);

  const otp = await OtpModel.findOne({
    subjectId: this._id,
    channel,
    purpose,
    codeHash,
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!otp) return false;

  await OtpModel.updateOne({ _id: otp._id }, { consumedAt: new Date(), $inc: { attempts: 1 } });

  return true;
};
