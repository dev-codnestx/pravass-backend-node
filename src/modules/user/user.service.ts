import httpStatus from 'http-status';
import mongoose from 'mongoose';

import User from '@/modules/user/user.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { IUserDoc, NewCreatedUser, NewRegisteredUser, UpdateUserBody } from './user.interfaces.js';

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

  return normalizedPayload;
};

/**
 * Create a user
 * @param {NewCreatedUser} userBody
 * @returns {Promise<IUserDoc>}
 */
export const createUser = async (userBody: NewCreatedUser): Promise<IUserDoc> => {
  if (await User.isEmailTaken(userBody.email))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already taken',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.EMAIL_ALREADY_IN_USE,
    );

  return User.create(normalizeUserPayload(userBody));
};

/**
 * Register a user
 * @param {NewRegisteredUser} userBody
 * @returns {Promise<IUserDoc>}
 */
export const registerUser = async (userBody: NewRegisteredUser): Promise<IUserDoc> => {
  if (await User.isEmailTaken(userBody.email))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already taken',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.EMAIL_ALREADY_IN_USE,
    );

  return User.create(normalizeUserPayload(userBody));
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
  Promise.resolve(User.paginate(filter, options as any));

/**
 * Get user by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserById = async (id: mongoose.Types.ObjectId): Promise<IUserDoc | null> => User.findById(id);

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserByEmail = async (email: string): Promise<IUserDoc | null> =>
  User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

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

  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already taken',
      undefined,
      true,
      '',
      responseCodes.UserResponseCodes.EMAIL_ALREADY_IN_USE,
    );

  Object.assign(user, normalizeUserPayload(updateBody));
  await user.save();
  return user;
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
