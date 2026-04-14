import crypto from 'node:crypto';

import httpStatus from 'http-status';
import mongoose from 'mongoose';

import { RoleModel } from '@/modules/roles/role.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { generateAuthTokens, verifyToken } from '../token/token.service.js';
import { Otp } from '../otp/otp.model.js';
import User from '../user/user.model.js';
import { IUserDoc, IUserWithTokens } from '../user/user.interfaces.js';
import { getUserByEmail, getUserById, updateUserById } from '../user/user.service.js';
import { resendOtp, sendOtp } from '../otp/otp.service.js';
import { isDummyIdentifier } from './auth.helper.js';

const { AuthResponseCodes, UserResponseCodes } = responseCodes;

type GenerateOtpInput = {
  phoneNumber: string | number;
  dialCode?: number;
};

type CreateAccountInput = {
  phoneNumber: string | number;
  dialCode?: number;
  email: string;
  firstName: string;
  lastName: string;
  birthdate?: string;
  userType?: string;
};

type AuthOtpSession = {
  isNewUser?: boolean;
  message?: string;
  orderId?: string;
  devOtpHint?: string;
};

type AuthUserDoc = IUserDoc & {
  isNewUser?: boolean;
  phone?: string;
  phoneNumber?: string;
  dialCode?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  userType?: string;
};

type AuthUserPayload = {
  id: string;
  phoneNumber: string;
  dialCode?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  userType?: string;
  fullName?: string;
  isNewUser: boolean;
};

type CreateAccountResult = {
  user: AuthUserPayload;
  tokens: ReturnType<typeof generateAuthTokens>;
  isNewUser: false;
};

type VerifyOtpResult = {
  isNewUser: boolean;
  message?: string;
  user?: AuthUserPayload;
  tokens?: ReturnType<typeof generateAuthTokens>;
};

const normalizeMobileNumber = (mobileNumber?: string | number): string =>
  String(mobileNumber ?? '')
    .replace(/\D+/g, '')
    .trim();

const normalizeEmail = (email?: string): string =>
  String(email ?? '')
    .trim()
    .toLowerCase();

const normalizeUserType = (userType?: string): string | undefined => {
  const normalizedUserType = String(userType ?? '')
    .trim()
    .toLowerCase();

  return normalizedUserType || undefined;
};

const findUserByMobileNumber = async (mobileNumber: string): Promise<AuthUserDoc | null> => {
  const normalizedMobileNumber = normalizeMobileNumber(mobileNumber);
  if (!normalizedMobileNumber) return null;

  return User.findOne({
    $or: [{ phoneNumber: normalizedMobileNumber }, { phone: normalizedMobileNumber }],
  }).exec() as Promise<AuthUserDoc | null>;
};

const findUserByEmailAddress = async (email: string): Promise<AuthUserDoc | null> => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  return User.findOne({
    $or: [{ email: normalizedEmail }, { user_email: normalizedEmail }],
  }).exec() as Promise<AuthUserDoc | null>;
};

const findOtpSessionByMobileNumber = async (mobileNumber: string) => {
  const normalizedMobileNumber = normalizeMobileNumber(mobileNumber);
  if (!normalizedMobileNumber) return null;

  return Otp.findOne({
    $or: [{ phone: Number(normalizedMobileNumber) }, { phoneNumber: Number(normalizedMobileNumber) }],
  } as any)
    .sort({ createdAt: -1 })
    .exec();
};

const consumeOtpSessionsByMobileNumber = async (mobileNumber: string): Promise<void> => {
  const normalizedMobileNumber = normalizeMobileNumber(mobileNumber);
  if (!normalizedMobileNumber) return;

  await Otp.deleteMany({
    $or: [{ phone: Number(normalizedMobileNumber) }, { phoneNumber: Number(normalizedMobileNumber) }],
  } as any);
};

const markOtpSessionVerified = async (mobileNumber: string): Promise<void> => {
  const otpSession = await findOtpSessionByMobileNumber(mobileNumber);
  if (!otpSession) return;

  otpSession.isVerified = true;
  await otpSession.save();
};

const buildAuthUserPayload = (user: AuthUserDoc, isNewUser = false): AuthUserPayload => {
  const mobileNumber = normalizeMobileNumber(user.phoneNumber ?? user.phone);
  const firstName = String(user.firstName ?? '').trim();
  const lastName = String(user.lastName ?? '').trim();
  const userType = normalizeUserType(user.userType);
  const fullName = String(user.fullName || `${firstName} ${lastName}`.trim()).trim();

  return {
    id: String(user._id),
    phoneNumber: mobileNumber,
    dialCode: user.dialCode,
    email: normalizeEmail(user.email) || undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    birthdate: user.birthdate,
    userType,
    fullName: fullName || undefined,
    isNewUser,
  };
};

let defaultRoleIdPromise: Promise<mongoose.Types.ObjectId> | null = null;
const getDefaultRoleId = (): Promise<mongoose.Types.ObjectId> => {
  if (defaultRoleIdPromise === null)
    defaultRoleIdPromise = (async () => {
      const preferredRole = await RoleModel.findOne({
        code: { $in: ['VIEWER', 'SALES_EXEC', 'MANAGER', 'ADMIN'] },
        status: 'active',
      }).select('_id');

      const fallbackRole =
        preferredRole ?? (await RoleModel.findOne({ status: 'active' }).sort({ createdAt: 1 }).select('_id'));
      if (!fallbackRole?._id)
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'No active role available for account creation');

      return new mongoose.Types.ObjectId(String(fallbackRole._id));
    })().catch((error) => {
      defaultRoleIdPromise = null;
      throw error;
    });

  return defaultRoleIdPromise;
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<IUserDoc>}
 */
export const loginUserWithEmailAndPassword = async (email: string, password: string): Promise<IUserDoc> => {
  const user = await getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password)))
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Incorrect email or password',
      undefined,
      true,
      '',
      AuthResponseCodes.INVALID_CREDENTIALS,
    );

  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
export const logout = async (_refreshToken: string): Promise<void> => {
  console.info('Logout', _refreshToken); // TODO: implement logout
};

/**
 * Logout from all devices
 * @param {IUserDoc} user
 * @returns {Promise<void>}
 */
export const logoutAll = async (user: IUserDoc): Promise<void> => {
  await updateUserById(user._id, {
    refreshTokenVersion: (user.refreshTokenVersion || 0) + 1,
  });
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<IUserWithTokens>}
 */
export const refreshAuth = async (refreshToken: string): Promise<IUserWithTokens> => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken);

    const user = await getUserById(new mongoose.Types.ObjectId(refreshTokenDoc.sub));
    if (!user) throw new Error();

    const tokens = await generateAuthTokens(user, Boolean(refreshTokenDoc.remember));
    return { user, tokens };
  } catch (_error) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Please authenticate',
      undefined,
      true,
      '',
      AuthResponseCodes.PLEASE_AUTHENTICATE,
    );
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
  try {
    const resetPasswordTokenDoc = await verifyToken(resetPasswordToken);
    const user = await getUserById(new mongoose.Types.ObjectId(resetPasswordTokenDoc.sub));
    if (!user) throw new Error();

    await updateUserById(user._id, { password: newPassword });
  } catch (_error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed', undefined, true, '', AuthResponseCodes.ERROR);
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<IUserDoc>}
 */
export const verifyEmail = async (verifyEmailToken: string): Promise<IUserDoc> => {
  try {
    const verifyEmailTokenDoc = await verifyToken(verifyEmailToken);
    const user = await getUserById(new mongoose.Types.ObjectId(verifyEmailTokenDoc.sub));
    if (!user) throw new Error();

    const updatedUser = await updateUserById(user._id, {
      isEmailVerified: true,
    });
    if (!updatedUser) throw new Error();

    return updatedUser;
  } catch (_error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed', undefined, true, '', AuthResponseCodes.ERROR);
  }
};

export const generateUserOtp = async (payload: GenerateOtpInput): Promise<AuthOtpSession> => {
  const mobileNumber = normalizeMobileNumber(payload.phoneNumber);
  if (!mobileNumber)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'phoneNumber is required',
      undefined,
      true,
      '',
      UserResponseCodes.INVALID_INPUT,
    );

  const matchedUser = await findUserByMobileNumber(mobileNumber);

  const otpSession = await sendOtp(mobileNumber, payload.dialCode);

  return {
    isNewUser: !matchedUser,
    orderId: otpSession.orderId,
    devOtpHint: otpSession.devOtpHint,
  };
};

export const resendUserOtp = async (orderId: string): Promise<AuthOtpSession> => {
  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedOrderId)
    throw new ApiError(httpStatus.BAD_REQUEST, 'OrderId is required', undefined, true, '', UserResponseCodes.INVALID_INPUT);

  return resendOtp(normalizedOrderId);
};

export const verifyPhoneOtp = async (userBody: {
  phoneNumber: string | number;
  otp: string | number;
}): Promise<VerifyOtpResult> => {
  const mobileNumber = normalizeMobileNumber(userBody.phoneNumber);
  const otp = String(userBody.otp ?? '').trim();

  if (!mobileNumber || !otp)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'phoneNumber and otp are required',
      undefined,
      true,
      '',
      UserResponseCodes.INVALID_INPUT,
    );

  const otpSession = await findOtpSessionByMobileNumber(mobileNumber);
  if (!otpSession)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'OTP expired or not found',
      undefined,
      true,
      '',
      UserResponseCodes.INVALID_OTP,
    );

  const isDummyMobile = isDummyIdentifier('phone', mobileNumber);

  if (!isDummyMobile && String(otpSession.otp) !== otp)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP', undefined, true, '', UserResponseCodes.INVALID_OTP);

  const matchedUser = await findUserByMobileNumber(mobileNumber);

  if (!matchedUser) {
    await markOtpSessionVerified(mobileNumber);
    return {
      isNewUser: true,
      message: 'Please complete registration.',
    };
  }

  await consumeOtpSessionsByMobileNumber(mobileNumber);
  const tokens = await generateAuthTokens(matchedUser);

  return {
    isNewUser: false,
    user: buildAuthUserPayload(matchedUser, false),
    tokens,
  };
};

export const createOtpUserAccount = async (payload: CreateAccountInput): Promise<CreateAccountResult> => {
  const mobileNumber = normalizeMobileNumber(payload.phoneNumber);
  const userEmail = normalizeEmail(payload.email);
  const firstName = String(payload.firstName || '').trim();
  const lastName = String(payload.lastName || '').trim();
  const userType = normalizeUserType(payload.userType) ?? 'website';
  const birthdate = String(payload.birthdate || '').trim();
  const dialCode = Number(payload.dialCode ?? 91) || 91;

  if (!mobileNumber || !userEmail || !firstName || !lastName)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'phoneNumber, email, firstName, and lastName are required',
      undefined,
      true,
      '',
      UserResponseCodes.INVALID_INPUT,
    );

  const verifiedOtpSession = await findOtpSessionByMobileNumber(mobileNumber);
  if (!verifiedOtpSession || !verifiedOtpSession.isVerified)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Please verify OTP before completing registration.',
      undefined,
      true,
      '',
      UserResponseCodes.INVALID_INPUT,
    );

  const existingEmailUser = await findUserByEmailAddress(userEmail);
  if (existingEmailUser)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already registered.',
      undefined,
      true,
      '',
      UserResponseCodes.EMAIL_ALREADY_IN_USE,
    );

  const existingMobileUser = await findUserByMobileNumber(mobileNumber);
  if (existingMobileUser)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Phone already registered.',
      undefined,
      true,
      '',
      UserResponseCodes.INVALID_INPUT,
    );

  const roleId = await getDefaultRoleId();
  const fullName = `${firstName} ${lastName}`.trim();

  const user = (await User.create({
    firstName,
    lastName,
    fullName,
    email: userEmail,
    phoneNumber: mobileNumber,
    dialCode,
    birthdate: birthdate || undefined,
    userType,
    passwordHash: crypto.randomBytes(24).toString('hex'),
    roleId,
    status: 'active',
    isEmailVerified: false,
  } as any)) as unknown as AuthUserDoc;

  await consumeOtpSessionsByMobileNumber(mobileNumber);
  const tokens = await generateAuthTokens(user);

  return {
    user: buildAuthUserPayload(user, false),
    tokens,
    isNewUser: false,
  };
};
