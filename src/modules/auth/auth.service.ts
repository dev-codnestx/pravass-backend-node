import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { getUserByEmail, getUserById, updateUserById } from '../user/user.service.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { generateAuthTokens, verifyToken } from '../token/token.service.js';
import { IUserDoc, IUserWithTokens } from '../user/user.interfaces.js';

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<IUserDoc>}
 */
export const loginUserWithEmailAndPassword = async (email: string, password: string): Promise<IUserDoc> => {
  const user = await getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password)))
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');

  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
export const logout = async (refreshToken: string): Promise<void> => {
  console.log('Logout', refreshToken); // TODO: implement logout
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<IUserWithTokens>}
 */
export const refreshAuth = async (refreshToken: string): Promise<IUserWithTokens> => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken);

    const user = await getUserById(new mongoose.Types.ObjectId(refreshTokenDoc.user));
    if (!user) throw new Error();

    const tokens = await generateAuthTokens(user);
    return { user, tokens };
  } catch (_error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
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
    const user = await getUserById(new mongoose.Types.ObjectId(resetPasswordTokenDoc.user));
    if (!user) throw new Error();

    await updateUserById(user.id, { password: newPassword });
  } catch (_error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<IUserDoc | null>}
 */
export const verifyEmail = async (verifyEmailToken: string): Promise<IUserDoc | null> => {
  try {
    const verifyEmailTokenDoc = await verifyToken(verifyEmailToken);
    const user = await getUserById(new mongoose.Types.ObjectId(verifyEmailTokenDoc.user));
    if (!user) throw new Error();

    const updatedUser = await updateUserById(user.id, {
      isEmailVerified: true,
    });
    return updatedUser;
  } catch (_error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};
