import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { sendResetPasswordEmail, sendVerificationMail } from '@/shared/email/email.service.js';
import catchAsync from '@/shared/utils/catchAsync.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';
import config from '@/shared/config/config.js';

import { tokenService } from '../token/index.js';
import { userService } from '../user/index.js';
import { authService } from './index.js';
import { oauthLogin } from './oauth/services/oauthLogin.service.js';

const cookieSameSite: 'none' | 'lax' = config.env === 'production' ? 'none' : 'lax';

const authCookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: cookieSameSite,
  path: '/',
};

const getRefreshTokenFromRequest = (req: Request): string | undefined =>
  (req.body?.refreshToken as string | undefined) || req.cookies?.refreshToken;

const getPlatformSourceFromRequest = (req: Request): string => {
  const clientType = req.get('x-client-type');
  return (clientType ? clientType.trim().toLowerCase() : 'website') || 'website';
};

const setAuthCookies = (res: Response, tokens: any) => {
  res.cookie('token', tokens.access.token, {
    ...authCookieOptions,
    expires: new Date(tokens.access.expires),
  });
  res.cookie('refreshToken', tokens.refresh.token, {
    ...authCookieOptions,
    expires: new Date(tokens.refresh.expires),
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie('token', authCookieOptions);
  res.clearCookie('refreshToken', authCookieOptions);
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.registerUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  setAuthCookies(res, tokens);
  res
    .status(httpStatus.CREATED)
    .success({ user, tokens }, responseCodes.AuthResponseCodes.SUCCESS, 'User registered successfully');
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password, remember = false } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user, Boolean(remember));
  setAuthCookies(res, tokens);
  res.success({ user, tokens }, responseCodes.AuthResponseCodes.SUCCESS, 'Login successful');
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (refreshToken) await authService.logout(refreshToken);

  clearAuthCookies(res);
  res.success(null, responseCodes.AuthResponseCodes.SUCCESS, 'Logout successful');
});

export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  const userWithTokens = await authService.refreshAuth(refreshToken || '');
  if ((userWithTokens as any).tokens) setAuthCookies(res, (userWithTokens as any).tokens);

  res.success(userWithTokens, responseCodes.AuthResponseCodes.SUCCESS, 'Tokens refreshed successfully');
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.success(null, responseCodes.AuthResponseCodes.SUCCESS, 'Reset password email sent successfully');
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.query['token'] as string, req.body.password);
  res.success(null, responseCodes.AuthResponseCodes.SUCCESS, 'Password reset successfully');
});

export const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await sendVerificationMail(req.user.email, verifyEmailToken, req.user.fullName);
  res.success(null, responseCodes.AuthResponseCodes.SUCCESS, 'Verification email sent successfully');
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.verifyEmail(req.query['token'] as string);
  const tokens = await tokenService.generateAuthTokens(user);
  setAuthCookies(res, tokens);
  res.success({ user, tokens }, responseCodes.AuthResponseCodes.SUCCESS, 'Email verified successfully');
});

export const logoutAll = catchAsync(async (req: Request, res: Response) => {
  await authService.logoutAll(req.user);
  clearAuthCookies(res);
  res.success(null, responseCodes.AuthResponseCodes.SUCCESS, 'Logout from all devices successful');
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.user._id);
  res.success({ user }, responseCodes.AuthResponseCodes.SUCCESS, 'Current user fetched successfully');
});

export const generateOtp = catchAsync(async (req: Request, res: Response) => {
  const otpSession = await authService.generateUserOtp({
    phoneNumber: req.body.phoneNumber,
    dialCode: req.body.dialCode,
  });
  res.success(otpSession, responseCodes.AuthResponseCodes.SUCCESS, 'Otp sent successfully');
});

export const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const otpSession = await authService.resendUserOtp(req.body.orderId);
  res.success(otpSession, responseCodes.AuthResponseCodes.SUCCESS, 'Otp resend successfully');
});

export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.verifyPhoneOtp({
    phoneNumber: req.body.phoneNumber,
    otp: req.body.otp,
  });

  if (result.isNewUser) {
    res.success(
      {
        isNewUser: true,
        message: result.message || 'Please complete registration.',
      },
      responseCodes.AuthResponseCodes.SUCCESS,
      'Otp verified successfully',
    );
    return;
  }

  if (result.tokens) setAuthCookies(res, result.tokens);

  res.success(
    {
      user: result.user,
      tokens: result.tokens,
      isNewUser: false,
    },
    responseCodes.AuthResponseCodes.SUCCESS,
    'Otp verified successfully',
  );
});

export const createAccount = catchAsync(async (req: Request, res: Response) => {
  const payload = await authService.createOtpUserAccount({
    phoneNumber: req.body.phoneNumber,
    dialCode: req.body.dialCode,
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    birthdate: req.body.birthdate,
    userType: getPlatformSourceFromRequest(req),
  });
  setAuthCookies(res, payload.tokens);
  res.success(payload, responseCodes.AuthResponseCodes.SUCCESS, 'Account created successfully');
});

export const oauthLoginController = async (req: Request, res: Response) => {
  const { provider, token } = req.body;
  const userType = getPlatformSourceFromRequest(req);

  const result = await oauthLogin({ provider, token }, userType);

  return res.success(result, responseCodes.AuthResponseCodes.SUCCESS, 'Login successful');
};
