import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

import User from '@/modules/user/user.model.js';
import logger from '@/shared/config/logger.js';
import { sendUserCredentialsEmail } from '@/shared/email/email.service.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { CreateUserResult, IUserDoc, NewCreatedUser, NewRegisteredUser, UpdateUserBody } from './user.interfaces.js';

const LEGACY_USER_EMAIL_FIELD = 'user_email' as const;

const ROLE_POPULATE = {
  path: 'roleId',
  select: 'name code description permissions isSystem status',
};

const populateRole = <T extends { populate: (path: unknown, select?: unknown) => T }>(query: T) =>
  query.populate(ROLE_POPULATE);

const normalizeEmail = (email?: string): string =>
  String(email ?? '')
    .trim()
    .toLowerCase();

const normalizeMobileNumber = (mobileNumber?: string | number): string =>
  String(mobileNumber ?? '')
    .replace(/\D+/g, '')
    .trim();

const getEmailErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return 'Unknown email error';
};

const getEmailErrorMeta = (error: unknown) => {
  if (!error || typeof error !== 'object') return {};

  const candidate = error as Record<string, unknown>;
  return {
    errorCode: typeof candidate.code === 'string' || typeof candidate.code === 'number' ? String(candidate.code) : undefined,
    command: typeof candidate.command === 'string' ? candidate.command : undefined,
    response: typeof candidate.response === 'string' ? candidate.response : undefined,
    responseCode: typeof candidate.responseCode === 'number' ? candidate.responseCode : undefined,
  };
};

/**
 * Get user by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IUserDoc | null>}
 */
export async function getUserById(id: mongoose.Types.ObjectId): Promise<IUserDoc | null> {
  return populateRole(User.findById(id));
}

const normalizeUserPayload = (payload: NewCreatedUser | NewRegisteredUser | UpdateUserBody) => {
  const normalizedPayload: Record<string, unknown> = { ...payload };

  if ('name' in payload && payload.name) {
    normalizedPayload.fullName = payload.name;
    delete normalizedPayload.name;
  }

  if ('password' in payload && payload.password) {
    normalizedPayload.passwordHash = payload.password;
    delete normalizedPayload.password;
  }

  if ('phone' in payload) {
    normalizedPayload.phoneNumber = typeof payload.phone === 'string' ? payload.phone.trim() : payload.phone;
    delete normalizedPayload.phone;
  }

  if ('phoneNumber' in payload && payload.phoneNumber)
    normalizedPayload.phoneNumber = normalizeMobileNumber(payload.phoneNumber);

  if ('dialCode' in payload && payload.dialCode !== undefined && payload.dialCode !== null)
    normalizedPayload.dialCode = Number(payload.dialCode);

  if (LEGACY_USER_EMAIL_FIELD in payload && payload[LEGACY_USER_EMAIL_FIELD])
    normalizedPayload.email = normalizeEmail(payload[LEGACY_USER_EMAIL_FIELD]);

  if ('first_name' in payload && payload.first_name) normalizedPayload.firstName = String(payload.first_name).trim();

  if ('last_name' in payload && payload.last_name) normalizedPayload.lastName = String(payload.last_name).trim();

  if ('platform_source' in payload && payload.platform_source)
    normalizedPayload.userType = String(payload.platform_source).trim().toLowerCase();

  if ('profileImage' in payload) normalizedPayload.profileImage = payload.profileImage;

  if ('roleId' in payload && payload.roleId) normalizedPayload.roleId = payload.roleId;

  if ('status' in payload && payload.status) normalizedPayload.status = payload.status;

  const firstName = typeof normalizedPayload.firstName === 'string' ? normalizedPayload.firstName.trim() : '';
  const lastName = typeof normalizedPayload.lastName === 'string' ? normalizedPayload.lastName.trim() : '';
  const derivedFullName = `${firstName} ${lastName}`.trim();
  if (!normalizedPayload.fullName && derivedFullName) normalizedPayload.fullName = derivedFullName;

  return normalizedPayload;
};

/**
 * Create a user
 * @param {NewCreatedUser} userBody
 * @returns {Promise<IUserDoc>}
 */
export const createUser = async (userBody: NewCreatedUser): Promise<CreateUserResult> => {
  const normalizedPayload = normalizeUserPayload(userBody);
  const plainPassword = typeof userBody.password === 'string' ? userBody.password : '';
  const email = typeof normalizedPayload.email === 'string' ? normalizedPayload.email : '';
  const mobileNumber = typeof normalizedPayload.phoneNumber === 'string' ? normalizedPayload.phoneNumber : '';

  if (email && (await User.isEmailTaken(email)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already taken',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.EMAIL_ALREADY_IN_USE,
    );

  if (mobileNumber && (await User.isMobileNumberTaken(mobileNumber)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Phone already taken',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.INVALID_INPUT,
    );

  const created = await User.create(normalizedPayload);
  let emailSent = true;
  let emailWarning: string | undefined;
  try {
    if (email && plainPassword)
      await sendUserCredentialsEmail(
        email,
        String(created.fullName || created.firstName || 'User').trim() || 'User',
        plainPassword,
      );
  } catch (error) {
    emailSent = false;
    const emailErrorMessage = getEmailErrorMessage(error);
    emailWarning = `User created but failed to send credentials email: ${emailErrorMessage}`;
    logger.error('User credentials email failed after user creation', {
      userId: String(created._id),
      email,
      emailWarning,
      ...getEmailErrorMeta(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
  const populated = await getUserById(created._id);
  return {
    user: populated ?? created,
    emailSent,
    emailWarning,
  };
};

/**
 * Register a user
 * @param {NewRegisteredUser} userBody
 * @returns {Promise<IUserDoc>}
 */
export const registerUser = async (userBody: NewRegisteredUser): Promise<IUserDoc> => {
  const normalizedPayload = normalizeUserPayload(userBody);
  const email = typeof normalizedPayload.email === 'string' ? normalizedPayload.email : '';
  const mobileNumber = typeof normalizedPayload.phoneNumber === 'string' ? normalizedPayload.phoneNumber : '';

  if (email && (await User.isEmailTaken(email)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already taken',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.EMAIL_ALREADY_IN_USE,
    );

  if (mobileNumber && (await User.isMobileNumberTaken(mobileNumber)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Phone already taken',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.INVALID_INPUT,
    );

  const created = await User.create(normalizedPayload);
  const populated = await getUserById(created._id);
  return populated ?? created;
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */

// TODO: later add correct type
/* eslint-disable @typescript-eslint/no-explicit-any */
export const queryUsers = (filter: Record<string, any>, options: PaginateOptions): Promise<QueryResult> =>
  Promise.resolve(User.paginate(filter, { ...(options as any), populate: options.populate || 'roleId' }));

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserByEmail = async (email: string): Promise<IUserDoc | null> =>
  populateRole(
    User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { [LEGACY_USER_EMAIL_FIELD]: email.toLowerCase().trim() }],
    }).select('+passwordHash'),
  );

/**
 * Update user by id
 * @param {mongoose.Types.ObjectId} userId
 * @param {UpdateUserBody} updateBody
 * @returns {Promise<IUserDoc | null>}
 */
export const updateUserById = async (
  userId: mongoose.Types.ObjectId,
  updateBody: UpdateUserBody,
): Promise<IUserDoc | null> => {
  const user = await getUserById(userId);
  if (!user)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.NOT_FOUND,
    );

  const normalizedPayload = normalizeUserPayload(updateBody);
  const email = typeof normalizedPayload.email === 'string' ? normalizedPayload.email : '';
  const mobileNumber = typeof normalizedPayload.phoneNumber === 'string' ? normalizedPayload.phoneNumber : '';

  if (email && (await User.isEmailTaken(email, userId)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already taken',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.EMAIL_ALREADY_IN_USE,
    );

  if (mobileNumber && (await User.isMobileNumberTaken(mobileNumber, userId)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Phone already taken',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.INVALID_INPUT,
    );

  Object.assign(user, normalizedPayload);
  await user.save();
  const populated = await getUserById(user._id);
  return populated ?? user;
};

/**
 * Delete user by id
 * @param {mongoose.Types.ObjectId} userId
 * @returns {Promise<IUserDoc | null>}
 */
export const deleteUserById = async (userId: mongoose.Types.ObjectId): Promise<IUserDoc | null> => {
  const user = await getUserById(userId);
  if (!user)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.NOT_FOUND,
    );

  await user.deleteOne();
  return user;
};

export const resendUserCredentialsById = async (userId: mongoose.Types.ObjectId): Promise<IUserDoc> => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.NOT_FOUND,
    );

  if (!user.email)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'User email is required',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.INVALID_INPUT,
    );

  const previousPasswordHash = user.passwordHash;
  const previousMustChangePassword = user.mustChangePassword;
  const temporaryPassword = crypto.randomBytes(8).toString('hex');

  user.passwordHash = temporaryPassword;
  user.mustChangePassword = true;
  await user.save();

  try {
    await sendUserCredentialsEmail(
      user.email,
      String(user.fullName || user.firstName || 'User').trim() || 'User',
      temporaryPassword,
    );
  } catch (error) {
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          passwordHash: previousPasswordHash,
          mustChangePassword: previousMustChangePassword,
        },
      },
    );

    const emailErrorMessage = getEmailErrorMessage(error);
    logger.error('Failed to resend user credentials email', {
      userId: String(userId),
      email: user.email,
      ...getEmailErrorMeta(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to resend credentials email: ${emailErrorMessage}`,
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.ERROR,
    );
  }

  const populated = await getUserById(user._id);
  return populated ?? user;
};
