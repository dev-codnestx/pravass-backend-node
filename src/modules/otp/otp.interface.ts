import { Document } from 'mongoose';

export interface IOtp {
  phone?: number;
  phoneNumber?: number;
  dialCode?: number;
  email?: string;
  otp: number;
  orderId: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface IOtpDoc extends IOtp, Document {}

export type NewCreatedOtp = IOtp;

export interface SendOtpPayload {
  route: string;
  sender_id: string;
  variables_values: string;
  numbers: string;
}

export interface OtpPayload {
  otp?: string;
  orderId: string;
  phoneNumber?: number;
  dialCode?: number;
  email?: string;
  userType?: string;
  deviceType?: string;
  deviceToken?: string;
}

export interface OtpRecord {
  _id: string;
  phone?: string;
  phoneNumber?: string;
  dialCode?: number;
  email?: string;
  otp: string;
  createdAt?: Date;
  updatedAt?: Date;
}
