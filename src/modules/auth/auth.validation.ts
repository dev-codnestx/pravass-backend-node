import Joi from 'joi';

import { password } from '@/shared/validations/custom.validation.js';

import { NewRegisteredUser } from '../user/user.interfaces.js';

// TODO: later add correct type
/* eslint-disable @typescript-eslint/no-explicit-any */
const registerBody: Partial<Record<keyof NewRegisteredUser, any>> = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
};

export const register = {
  body: Joi.object().keys(registerBody),
};

export const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    remember: Joi.boolean().optional(),
  }),
};

export const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().optional(),
  }),
};

export const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().optional(),
  }),
};

export const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

export const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

export const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

export const authValidation = {
  register,
  login,
  logout,
  refreshToken: refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
