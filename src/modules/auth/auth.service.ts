import crypto from 'node:crypto';

import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { RoleModel } from '@/modules/roles/role.model.js';
import config from '@/shared/config/config.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { generateAuthTokens, verifyToken } from '../token/token.service.js';
import User from '../user/user.model.js';
import { IUserDoc, IUserWithTokens } from '../user/user.interfaces.js';
import { getUserByEmail, getUserById, updateUserById } from '../user/user.service.js';
import { resendOtp, sendOtp } from '../otp/otp.service.js';
import { getIdentifier, handleUserVerification, isDummyIdentifier } from './auth.helper.js';
import { OtpPayload } from '../otp/otp.interface.js';

const { AuthResponseCodes, UserResponseCodes } = responseCodes;

const VERIFICATION_TOKEN_EXPIRY = '10m';

type GenerateOtpInput = {
  phoneNumber?: string | number;
  dialCode?: number;
  email?: string;
};

type CreateAccountInput = {
  verificationToken: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  email: string;
  userType?: string;
};

type AuthOtpSession = {
  orderId: string;
  devOtpHint?: string;
};

type VerifiedOtpUser = IUserDoc & {
  isNewUser?: boolean;
  verificationToken?: string;
  phoneNumber?: string;
  dialCode?: number;
  userType?: string;
};

type AuthOtpUserPayload = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  phoneNumber?: string;
  dialCode?: number;
  userType?: string;
  isNewUser: boolean;
  verificationToken?: string;
};

type CreateAccountResult = {
  user: AuthOtpUserPayload;
  tokens: ReturnType<typeof generateAuthTokens>;
  isNewUser: false;
};

type VerificationTokenPayload = {
  typ: 'otp_signup';
  phone?: string;
  dialCode?: number;
  email?: string;
  userType?: string;
  iat?: number;
  exp?: number;
};

const normalizePhone = (phone?: string | number): string =>
  String(phone ?? '')
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

const stripDialCode = (fullPhone: string, dialCode = 91): string => {
  const normalizedPhone = normalizePhone(fullPhone);
  const dialCodeString = String(dialCode || 91);
  if (normalizedPhone.startsWith(dialCodeString) && normalizedPhone.length > dialCodeString.length + 3)
    return normalizedPhone.slice(dialCodeString.length);

  return normalizedPhone;
};

const withDialCode = (phoneNumber?: string, dialCode = 91): string | undefined => {
  if (!phoneNumber) return undefined;
  const normalizedPhone = normalizePhone(phoneNumber);
  if (!normalizedPhone) return undefined;
  const dialCodeString = String(dialCode || 91);
  return normalizedPhone.startsWith(dialCodeString) ? normalizedPhone : `${dialCodeString}${normalizedPhone}`;
};

const resolveOtpIdentifiers = (payload: { phoneNumber?: string | number; dialCode?: number; email?: string }) => {
  const phoneNumber = normalizePhone(payload.phoneNumber);
  const email = normalizeEmail(payload.email);
  const dialCode = Number(payload.dialCode || 91);

  if (!phoneNumber && !email)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Please provide phone number or email',
      undefined,
      true,
      '',
      UserResponseCodes.INVALID_INPUT,
    );

  return {
    phoneNumber: phoneNumber || undefined,
    email: email || undefined,
    dialCode,
    fullPhone: phoneNumber ? withDialCode(phoneNumber, dialCode) : undefined,
  };
};

const buildOtpUser = (
  user: IUserDoc,
  isNewUser: boolean,
  verificationToken?: string,
  fallbackDialCode = 91,
): AuthOtpUserPayload => {
  const fullPhone = normalizePhone(user.phoneNumber ?? user.phone);
  const dialCode = fallbackDialCode || 91;
  const phoneNumber = fullPhone ? stripDialCode(fullPhone, dialCode) : undefined;

  return {
    id: String(user._id),
    name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Traveler',
    email: user.email || undefined,
    phone: fullPhone || user.email || '',
    phoneNumber,
    dialCode: phoneNumber ? dialCode : undefined,
    userType: normalizeUserType(user.userType),
    isNewUser,
    verificationToken,
  };
};

const assertUserIsActive = (user: IUserDoc | null) => {
  if (!user) return;
  if (user.status !== 'active')
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Account is not active',
      undefined,
      true,
      '',
      AuthResponseCodes.ACCOUNT_NOT_ACTIVE,
    );
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

const issueVerificationToken = (payload: {
  phone?: string;
  dialCode?: number;
  email?: string;
  userType?: string;
}): string => {
  const tokenPayload: VerificationTokenPayload = {
    typ: 'otp_signup',
    phone: payload.phone,
    dialCode: payload.dialCode,
    email: payload.email,
    userType: normalizeUserType(payload.userType),
  };

  return jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: VERIFICATION_TOKEN_EXPIRY });
};

const readVerificationToken = (token: string): { phone?: string; dialCode?: number; email?: string; userType?: string } => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as VerificationTokenPayload;
    if (payload.typ !== 'otp_signup') throw new Error('invalid token type');

    return {
      phone: normalizePhone(payload.phone),
      dialCode: Number(payload.dialCode || 91),
      email: normalizeEmail(payload.email) || undefined,
      userType: normalizeUserType(payload.userType),
    };
  } catch {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Verification session expired',
      undefined,
      true,
      '',
      UserResponseCodes.INVALID_INPUT,
    );
  }
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
  const { phoneNumber, email, dialCode } = resolveOtpIdentifiers(payload);

  const [matchedUserByPhone, matchedUserByEmail] = await Promise.all([
    phoneNumber ? User.findOne({ phoneNumber, dialCode }).select('email status') : Promise.resolve(null),
    email ? User.findOne({ email }).select('phoneNumber status') : Promise.resolve(null),
  ]);

  if (phoneNumber && email) {
    if (matchedUserByPhone && matchedUserByEmail && String(matchedUserByPhone._id) !== String(matchedUserByEmail._id))
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Phone number or email is wrong',
        undefined,
        true,
        '',
        UserResponseCodes.INVALID_INPUT,
      );

    if (matchedUserByPhone && !matchedUserByEmail)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Email is wrong for this phone number',
        undefined,
        true,
        '',
        UserResponseCodes.INVALID_INPUT,
      );

    if (!matchedUserByPhone && matchedUserByEmail)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Phone number is wrong for this email',
        undefined,

        true,
        '',
        UserResponseCodes.INVALID_INPUT,
      );
  }

  assertUserIsActive(matchedUserByPhone);
  assertUserIsActive(matchedUserByEmail);

  return sendOtp(phoneNumber, dialCode, email);
};

export const resendUserOtp = async (orderId: string): Promise<AuthOtpSession> => {
  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedOrderId)
    throw new ApiError(httpStatus.BAD_REQUEST, 'OrderId is required', undefined, true, '', UserResponseCodes.INVALID_INPUT);

  return resendOtp(normalizedOrderId);
};

export const verifyPhoneOtp = async (userBody: OtpPayload) => {
  const identifier = getIdentifier(userBody);
  const userType = normalizeUserType(userBody.userType) ?? 'website';
  const verificationResult = isDummyIdentifier(identifier.type, identifier.value)
    ? await handleUserVerification(
        identifier,
        { ...userBody, userType },
        {
          skipOtpVerification: true,
        },
      )
    : await handleUserVerification(identifier, { ...userBody, userType });

  const userInfo = verificationResult.userInfo as VerifiedOtpUser;
  const isNewUser = Boolean(verificationResult.isNewUser);

  userInfo.isNewUser = isNewUser;
  userInfo.phoneNumber = identifier.query?.phoneNumber ? String(identifier.query.phoneNumber) : undefined;
  userInfo.dialCode = identifier.query?.dialCode ? Number(identifier.query.dialCode) : undefined;
  const verificationToken = isNewUser
    ? issueVerificationToken({
        phone: userInfo.phoneNumber,
        dialCode: userInfo.dialCode,
        email: identifier.query?.email ? String(identifier.query.email) : undefined,
        userType,
      })
    : undefined;

  return {
    userDoc: userInfo,
    user: buildOtpUser(userInfo, isNewUser, verificationToken, userInfo.dialCode || 91),
    isNewUser,
    verificationToken,
  };
};

export const createOtpUserAccount = async (payload: CreateAccountInput): Promise<CreateAccountResult> => {
  const verificationToken = String(payload.verificationToken || '').trim();
  const firstName = String(payload.firstName || '').trim();
  const lastName = String(payload.lastName || '').trim();
  const birthdate = String(payload.birthdate || '').trim();
  const email = normalizeEmail(payload.email);

  if (!verificationToken || !firstName || !lastName || !birthdate || !email)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'All account fields are required',
      undefined,
      true,
      '',
      UserResponseCodes.INVALID_INPUT,
    );

  const verificationPayload = readVerificationToken(verificationToken);
  const linkedPhone = normalizePhone(verificationPayload.phone);
  const linkedEmail = normalizeEmail(verificationPayload.email);
  const linkedDialCode = Number(verificationPayload.dialCode || 91);
  const userType = normalizeUserType(payload.userType ?? verificationPayload.userType) ?? 'website';
  const fullName = `${firstName} ${lastName}`.trim();
  const hasEmail = Boolean(email);
  const emailQuery = hasEmail ? { email } : null;

  const [userByPhone, userByTokenEmail, userBySubmittedEmail] = await Promise.all([
    linkedPhone ? User.findOne({ phoneNumber: linkedPhone, dialCode: linkedDialCode }) : Promise.resolve(null),
    linkedEmail ? User.findOne({ email: linkedEmail }) : Promise.resolve(null),
    emailQuery ? User.findOne(emailQuery) : Promise.resolve(null),
  ]);

  if (userBySubmittedEmail && userByPhone && String(userBySubmittedEmail._id) !== String(userByPhone._id))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already in use',
      undefined,
      true,
      '',
      UserResponseCodes.EMAIL_ALREADY_IN_USE,
    );

  if (userBySubmittedEmail && userByTokenEmail && String(userBySubmittedEmail._id) !== String(userByTokenEmail._id))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already in use',
      undefined,
      true,
      '',
      UserResponseCodes.EMAIL_ALREADY_IN_USE,
    );

  let user = userByPhone || userByTokenEmail || userBySubmittedEmail;

  if (!user) {
    const roleId = await getDefaultRoleId();
    user = await User.create({
      firstName,
      lastName,
      fullName,
      birthdate,
      ...(hasEmail ? { email } : {}),
      phoneNumber: linkedPhone || undefined,
      dialCode: linkedPhone ? linkedDialCode : undefined,
      userType,
      passwordHash: crypto.randomBytes(24).toString('hex'),
      roleId,
      status: 'active',
      isEmailVerified: hasEmail,
    });
  } else {
    if (hasEmail && (await User.isEmailTaken(email, user._id)))
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Email already in use',
        undefined,
        true,
        '',
        UserResponseCodes.EMAIL_ALREADY_IN_USE,
      );

    user.firstName = firstName;
    user.lastName = lastName;
    user.fullName = fullName;
    user.birthdate = birthdate;
    user.userType = userType;
    if (hasEmail) {
      user.email = email;
      user.isEmailVerified = true;
    }
    if (!user.phoneNumber && linkedPhone) user.phoneNumber = linkedPhone;
    if (!user.dialCode && linkedPhone) user.dialCode = linkedDialCode;

    if (!hasEmail) user.isEmailVerified = Boolean(user.isEmailVerified || linkedEmail);
    await user.save();
  }

  const tokens = await generateAuthTokens(user);
  return {
    user: {
      ...buildOtpUser(user, false, undefined, linkedDialCode),
      isNewUser: false,
    },
    tokens,
    isNewUser: false,
  };
};
