import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import mongoose from 'mongoose';

import tokenTypes from '@/modules/token/token.types.js';
import config from '@/shared/config/config.js';
import ApiError from '@/shared/utils/errors/ApiError.js';

import { IUserDoc } from '../user/user.interfaces.js';
import { getUserByEmail } from '../user/user.service.js';

import { AccessAndRefreshTokens, IPayload } from './token.interfaces.js';

/**
 * Generate token
 * @param {mongoose.Types.ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
export const generateToken = (
  userId: mongoose.Types.ObjectId,
  expires: Moment,
  type: string,
  secret: string = config.jwt.secret,
): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @returns {Promise<IPayload>}
 */
export const verifyToken = async (token: string): Promise<IPayload> => {
  const payload = jwt.verify(token, config.jwt.secret) as IPayload;

  return payload;
};

/**
 * Generate auth tokens
 * @param {IUserDoc} user
 * @returns {ITokens}
 */
export const generateAuthTokens = (user: IUserDoc, remember = false): AccessAndRefreshTokens => {
  const accessTokenExpires = config.jwt.accessExpirationMinutes * 60;
  const refreshDays = remember ? config.jwt.refreshExpirationDays : config.jwt.refreshExpirationSessionDays;
  const refreshTokenExpires = refreshDays * 24 * 60 * 60;

  const basePayload = {
    sub: user._id,
    iat: Math.round(Date.now() / 1000),
  };

  const accessToken = jwt.sign({ ...basePayload, type: tokenTypes.ACCESS }, config.jwt.secret, {
    expiresIn: accessTokenExpires,
    algorithm: 'HS256',
  });

  const refreshToken = jwt.sign({ ...basePayload, type: tokenTypes.REFRESH, remember }, config.jwt.secret, {
    expiresIn: refreshTokenExpires,
    algorithm: 'HS256',
  });

  return {
    access: {
      token: accessToken,
      expires: new Date(Date.now() + accessTokenExpires * 1000),
    },
    refresh: {
      token: refreshToken,
      expires: new Date(Date.now() + refreshTokenExpires * 1000),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
export const generateResetPasswordToken = async (email: string): Promise<string> => {
  const user = await getUserByEmail(email);
  if (!user) throw new ApiError(httpStatus.NO_CONTENT, '');

  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user._id, expires, tokenTypes.RESET_PASSWORD);

  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {IUserDoc} user
 * @returns {Promise<string>}
 */
export const generateVerifyEmailToken = (user: IUserDoc): Promise<string> => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(user._id, expires, tokenTypes.VERIFY_EMAIL);
  return Promise.resolve(verifyEmailToken);
};
