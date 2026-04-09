import httpStatus from 'http-status';
import mongoose from 'mongoose';

import ApiError from '@/shared/utils/errors/ApiError.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { generateAuthTokens, verifyToken } from '../token/token.service.js';
import { IUserDoc, IUserWithTokens } from '../user/user.interfaces.js';
import { getUserByEmail, getUserById, updateUserById } from '../user/user.service.js';

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
      responseCodes.AuthResponseCodes.INVALID_CREDENTIALS,
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
      responseCodes.AuthResponseCodes.PLEASE_AUTHENTICATE,
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
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Password reset failed',
      undefined,
      true,
      '',
      responseCodes.AuthResponseCodes.ERROR,
    );
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
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Email verification failed',
      undefined,
      true,
      '',
      responseCodes.AuthResponseCodes.ERROR,
    );
  }
};
