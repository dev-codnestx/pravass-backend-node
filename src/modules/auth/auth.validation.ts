import Joi from 'joi';

import { generateJoiValidation } from '@/shared/validations/generateJoiValidation.js';
import { password } from '@/shared/validations/custom.validation.js';

const registerBody = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
};

export const register = {
  body: generateJoiValidation(registerBody),
};

export const login = {
  body: generateJoiValidation({
    email: Joi.string().required(),
    password: Joi.string().required(),
    remember: Joi.boolean().optional(),
  }),
};

export const logout = {
  body: generateJoiValidation({
    refreshToken: Joi.string().optional(),
  }),
};

export const refreshTokens = {
  body: generateJoiValidation({
    refreshToken: Joi.string().optional(),
  }),
};

export const forgotPassword = {
  body: generateJoiValidation({
    email: Joi.string().email().required(),
  }),
};

export const resetPassword = {
  query: generateJoiValidation({
    token: Joi.string().required(),
  }),
  body: generateJoiValidation({
    password: Joi.string().required().custom(password),
  }),
};

export const verifyEmail = {
  query: generateJoiValidation({
    token: Joi.string().required(),
  }),
};

const mobileNumberSchema = Joi.alternatives().try(
  Joi.string()
    .trim()
    .pattern(/^[0-9]{6,15}$/),
  Joi.number().integer(),
);

export const generateOtp = {
  body: generateJoiValidation({
    phoneNumber: mobileNumberSchema.required(),
    dialCode: Joi.alternatives()
      .try(
        Joi.string()
          .trim()
          .pattern(/^[0-9]{1,5}$/),
        Joi.number().integer(),
      )
      .optional(),
  }),
};

export const resendOtp = {
  body: generateJoiValidation({
    orderId: Joi.string().required(),
  }),
};

export const verifyOtp = {
  body: generateJoiValidation({
    phoneNumber: mobileNumberSchema.required(),
    otp: Joi.alternatives()
      .try(
        Joi.string()
          .trim()
          .pattern(/^[0-9]{4,6}$/),
        Joi.number().integer(),
      )
      .required(),
  }),
};

export const createAccount = {
  body: generateJoiValidation({
    phoneNumber: mobileNumberSchema.required(),
    dialCode: Joi.alternatives()
      .try(
        Joi.string()
          .trim()
          .pattern(/^[0-9]{1,5}$/),
        Joi.number().integer(),
      )
      .optional(),
    email: Joi.string().email().required(),
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    birthdate: Joi.string().trim().optional(),
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
  generateOtp,
  resendOtp,
  verifyOtp,
  createAccount,
};
