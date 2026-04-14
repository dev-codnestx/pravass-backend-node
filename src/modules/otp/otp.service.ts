import { v4 as uuidv4 } from 'uuid';
import { generateSixDigitRandomNumber } from '@/shared/utils/commonHelper.js';
import { Otp } from './otp.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { defaultStatus } from '@/shared/utils/responseCode/httpStatusAlias.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import {
  isDummyIdentifier,
  normalizeEmail,
  normalizePhone,
  saveOtp,
  sendEmailOtp,
  sendPhoneOtp,
} from '../auth/auth.helper.js';
import { OtpPayload, OtpRecord } from './otp.interface.js';

const { OtpResponseCodes } = responseCodes;

export type OtpSessionResult = {
  orderId: string;
  devOtpHint?: string;
};

const shouldExposeDevOtp = (phone?: string, email?: string): boolean =>
  Boolean(phone && isDummyIdentifier('phone', phone)) || Boolean(email && isDummyIdentifier('email', email));

export const sendOtp = async (phone?: number | string, dialCode?: number, email?: string): Promise<OtpSessionResult> => {
  if (!phone && !email)
    throw new ApiError(
      defaultStatus.BAD_REQUEST,
      'Either phone number or email is required to send OTP',
      undefined,
      true,
      '',
      OtpResponseCodes.INVALID_INPUT,
    );

  const orderId = uuidv4();
  const otpCode = generateSixDigitRandomNumber();

  try {
    if (phone) {
      const phoneStr = normalizePhone(phone);
      if (isDummyIdentifier('phone', phoneStr))
        console.info(`[OTP] Dummy phone bypassed for ${phoneStr}. OrderId: ${orderId}. OTP: ${otpCode}`);
      else await sendPhoneOtp(phoneStr, otpCode, dialCode);

      await saveOtp({ phone: Number(phoneStr), dialCode: dialCode || 91 }, otpCode, orderId);
    }

    if (email) {
      const emailStr = normalizeEmail(email);
      if (isDummyIdentifier('email', emailStr))
        console.info(`[OTP] Dummy email bypassed for ${emailStr}. OrderId: ${orderId}. OTP: ${otpCode}`);
      else await sendEmailOtp(emailStr, otpCode);

      await saveOtp({ email: emailStr }, otpCode, orderId);
    }

    return {
      orderId,
      devOtpHint: shouldExposeDevOtp(phone ? normalizePhone(phone) : undefined, email ? normalizeEmail(email) : undefined)
        ? String(otpCode)
        : undefined,
    };
  } catch (err) {
    console.error('OTP Send Error:', err);

    throw new ApiError(defaultStatus.OK, 'Failed to send OTP', undefined, true, '', OtpResponseCodes.FAILED_TO_SEND_OTP);
  }
};

/**
 * Re-send the *same* OTP for an existing orderId.
 */
export const resendOtp = async (orderId: string): Promise<OtpSessionResult> => {
  const doc = await Otp.findOne({ orderId });
  if (!doc) throw new ApiError(defaultStatus.OK, 'OTP session expired', undefined, true, '', OtpResponseCodes.OTP_NOT_FOUND);

  try {
    await Otp.deleteMany({ $or: [{ phone: doc.phone }, { email: doc.email }] });

    return sendOtp(doc.phone, doc.dialCode, doc.email);
  } catch (_err) {
    throw new ApiError(defaultStatus.OK, 'Failed to resend OTP', undefined, true, '', OtpResponseCodes.FAILED_TO_RESEND_OTP);
  }
};

export const verifyOtp = async (userBody: OtpPayload): Promise<boolean> => {
  try {
    const { otp, orderId }: OtpPayload = userBody;
    const otpRecord: OtpRecord | null = await Otp.findOne({
      orderId: orderId,
    });

    if (!otpRecord)
      throw new ApiError(defaultStatus.OK, 'OTP expired or not found', undefined, true, '', OtpResponseCodes.OTP_EXPIRED);

    if (otpRecord.otp !== otp)
      throw new ApiError(defaultStatus.OK, 'Invalid OTP', undefined, true, '', OtpResponseCodes.INVALID_OTP);

    await Otp.deleteOne({ _id: otpRecord._id });

    return true;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(defaultStatus.OK, 'Failed to verify OTP', undefined, true, '', OtpResponseCodes.INVALID_OTP);
  }
};
