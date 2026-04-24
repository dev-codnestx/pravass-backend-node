import { Schema, Types, model } from 'mongoose';

import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import { ICustomerDoc, ICustomerModel } from './customer.interfaces.js';
import { calculateAgeFromBirthdate, formatDateDDMMYYYY, formatPhoneWithDialCode } from './customer.utils.js';

const customerSchema = new Schema<ICustomerDoc, ICustomerModel>(
  {
    fullName: { type: String, trim: true, required: true },
    sourceUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      set: (value: string) =>
        String(value ?? '')
          .trim()
          .toLowerCase(),
    },
    phoneNumber: { type: String, trim: true },
    dialCode: { type: Number, default: 91 },
    address: { type: String, trim: true },
    birthdate: { type: String, trim: true },
    profileImage: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'locked'],
      default: 'active',
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

customerSchema.index(
  { sourceUserId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceUserId: { $exists: true },
      isDeleted: false,
    },
  },
);

customerSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: 'string', $ne: '' },
      isDeleted: false,
    },
  },
);

customerSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phoneNumber: { $type: 'string', $ne: '' },
      isDeleted: false,
    },
  },
);

customerSchema.statics.isEmailTaken = async function (email: string, excludeCustomerId?: Types.ObjectId) {
  const customer = await this.findOne({
    email,
    _id: { $ne: excludeCustomerId },
    isDeleted: false,
  });
  return !!customer;
};

customerSchema.statics.isMobileNumberTaken = async function (phoneNumber: string, excludeCustomerId?: Types.ObjectId) {
  const customer = await this.findOne({
    phoneNumber,
    _id: { $ne: excludeCustomerId },
    isDeleted: false,
  });
  return !!customer;
};

customerSchema.virtual('age').get(function (this: ICustomerDoc) {
  return calculateAgeFromBirthdate(this.birthdate);
});

customerSchema.virtual('birthdateFormatted').get(function (this: ICustomerDoc) {
  return formatDateDDMMYYYY(this.birthdate);
});

customerSchema.virtual('createdAtFormatted').get(function (this: ICustomerDoc) {
  return formatDateDDMMYYYY(this.createdAt);
});

customerSchema.virtual('updatedAtFormatted').get(function (this: ICustomerDoc) {
  return formatDateDDMMYYYY(this.updatedAt);
});

customerSchema.virtual('phoneWithDialCode').get(function (this: ICustomerDoc) {
  return formatPhoneWithDialCode(this.dialCode, this.phoneNumber);
});

customerSchema.plugin(toJSON);
customerSchema.plugin(paginate);

export const CustomerModel = model<ICustomerDoc, ICustomerModel>('Customer', customerSchema);
export default CustomerModel;
