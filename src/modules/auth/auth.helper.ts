import httpStatus from 'http-status';

import ApiError from '@/shared/utils/errors/ApiError.js';

import responseCodes from '@/shared/utils/responseCode/responseCode.js';
import User from '../user/user.model.js';
import config from '@/shared/config/config.js';
import axios from 'axios';
import { OtpPayload } from '../otp/otp.interface.js';
import { Identifier } from './auth.interfaces.js';
import { verifyOtp } from '../otp/otp.service.js';
import { Otp } from '../otp/otp.model.js';
import { sendTemplatedEmail } from '@/shared/email/email.service.js';
import { IUserDoc } from '../user/user.interfaces.js';
const { UserResponseCodes } = responseCodes;

//
const rawNumbers = [
  '1234567890',
  '9999999999',
  '8888888888',
  '7777777777',
  '6666666666',
  '5555555555',
  '4444444444',
  '3333333333',
  '2222222222',
  '1111111111',
];

const DUMMY_TEST_NUMBERS = rawNumbers.map((number) => ({ phoneNumber: Number(number) }));

// Dummy emails for bypass
const DUMMY_TEST_EMAILS = ['test@example.com', 'demo@karuna.org', 'user@test.com', 'otp@bypass.com'];

export const getIdentifier = (payload: OtpPayload): Identifier => {
  if (payload.phoneNumber)
    return {
      type: 'phone',
      value: String(payload.phoneNumber),
      query: {
        phoneNumber: String(payload.phoneNumber),
        dialCode: payload.dialCode || 91,
      },
    };

  if (payload.email)
    return {
      type: 'email',
      value: payload.email.toLowerCase(),
      query: { email: payload.email.toLowerCase() },
    };

  throw new ApiError(
    httpStatus.BAD_REQUEST,
    'Either phone number or email is required',
    undefined,
    true,
    '',
    UserResponseCodes.INVALID_INPUT,
  );
};

export const isDummyIdentifier = (type: 'phone' | 'email', value: string) => {
  if (type === 'phone') return DUMMY_TEST_NUMBERS.some((e) => Number(e.phoneNumber) === Number(value));

  return DUMMY_TEST_EMAILS.some((e) => e.toLowerCase() === value.toLowerCase());
};

type UserVerificationDoc = IUserDoc & {
  isNewUser?: boolean;
  phoneNumber?: string;
  userType?: string;
  deviceToken?: string;
  deviceType?: string;
};

export const findOrCreateUser = async (query: Record<string, unknown>): Promise<UserVerificationDoc> => {
  let user = (await User.findOne(query).exec()) as unknown as UserVerificationDoc | null;

  if (!user)
    user = (await User.create({
      ...query,
      isNewUser: true,
    })) as unknown as UserVerificationDoc;

  return user;
};

export const updateDeviceInfo = async (user: UserVerificationDoc, payload: OtpPayload) => {
  const userType = String(payload.userType ?? '')
    .trim()
    .toLowerCase();

  if (payload.deviceToken && payload.deviceType) {
    user.deviceToken = payload.deviceToken;
    user.deviceType = payload.deviceType;
  }

  if (userType) user.userType = userType;

  if (payload.deviceToken || payload.deviceType || userType) await user.save();
};

export const handleUserVerification = async (
  identifier: {
    type: 'phone' | 'email';
    value: string;
    query: Record<string, unknown>;
  },
  userBody: OtpPayload,
  options?: { skipOtpVerification?: boolean },
) => {
  console.log('🚀 ~ handleUserVerification ~ identifier:', identifier);
  if (!options?.skipOtpVerification) {
    const verified = await verifyOtp(userBody);

    if (!verified)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid or expired OTP',
        undefined,
        true,
        '',
        UserResponseCodes.INVALID_OTP,
      );
  }

  const userInfo = await findOrCreateUser(identifier.query);
  console.log('🚀 ~ handleUserVerification ~ userInfo:', userInfo);

  await updateDeviceInfo(userInfo, userBody);

  return { userInfo, isNewUser: Boolean(userInfo?.isNewUser) };
};

export const normalizePhone = (phone: number | string): string => String(phone).replace(/\s+/g, '');

export const normalizeEmail = (email: string): string => email.toLowerCase();

export const saveOtp = async (
  data: { phone?: number; phoneNumber?: number; dialCode?: number; email?: string },
  otp: number,
  orderId: string,
) => {
  await Otp.deleteMany({ $or: [{ phone: data.phone }, { phoneNumber: data.phoneNumber }, { email: data.email }] });
  await Otp.create({ ...data, otp, orderId });
};

export const sendPhoneOtp = async (phone: string, otpCode: number, dialCode?: number) => {
  const isIndianNumber = dialCode && dialCode === 91;

  if (isIndianNumber) {
    const payload = {
      route: config.fast2sms.route,
      // Fast2SMS requires snake_case field names.
      // eslint-disable-next-line camelcase
      sender_id: config.fast2sms.senderId,
      message: config.fast2sms.msgId,
      // Fast2SMS requires snake_case field names.
      // eslint-disable-next-line camelcase
      variables_values: otpCode,
      numbers: dialCode ? `${dialCode}${phone}` : phone,
    };

    await axios.post(config.fast2sms.apiUrl, payload, {
      headers: {
        authorization: config.fast2sms.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }
};

export const sendEmailOtp = async (email: string, otpCode: number) => {
  await sendTemplatedEmail({
    to: email,
    subject: 'Your Karuna Verification Code',
    templateName: 'otp-verification',
    replacements: {
      userName: email.split('@')[0] || 'User',
      otpCode: String(otpCode),
    },
  });
};
