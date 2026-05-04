import mongoose from 'mongoose';
import httpStatus from 'http-status';

import UserModel from '@/modules/user/user.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { CreateCustomerBody, CreateCustomerResult, ICustomerDoc, UpdateCustomerBody } from './customer.interfaces.js';
import CustomerModel from './customer.model.js';
import { normalizeBirthdateInput, normalizeDialCode } from './customer.utils.js';

const LEGACY_USER_EMAIL_FIELD = 'user_email' as const;

const normalizeEmail = (email?: string): string =>
  String(email ?? '')
    .trim()
    .toLowerCase();

const normalizeMobileNumber = (mobileNumber?: string | number): string =>
  String(mobileNumber ?? '')
    .replace(/\D+/g, '')
    .trim();

const normalizeStatus = (status?: string): 'active' | 'inactive' | 'locked' => {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase();
  if (normalized === 'inactive') return 'inactive';
  if (normalized === 'locked') return 'locked';
  return 'active';
};

const toObjectIdOrNull = (value?: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId | null => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

const getCustomerById = async (customerId: mongoose.Types.ObjectId): Promise<ICustomerDoc | null> =>
  CustomerModel.findOne({
    _id: customerId,
    isDeleted: false,
  }).populate('sourceUserId', 'fullName email phoneNumber');

const findCustomerBySourceUserId = async (sourceUserId?: mongoose.Types.ObjectId | null): Promise<ICustomerDoc | null> => {
  if (!sourceUserId) return null;
  return CustomerModel.findOne({
    sourceUserId,
    isDeleted: false,
  });
};

const findCustomerByUniqueFields = async ({
  sourceUserId,
  email,
  phoneNumber,
}: {
  sourceUserId?: mongoose.Types.ObjectId | null;
  email?: string;
  phoneNumber?: string;
}): Promise<ICustomerDoc | null> => {
  if (sourceUserId) {
    const bySourceUser = await findCustomerBySourceUserId(sourceUserId);
    if (bySourceUser) return bySourceUser;
  }

  const orFilters: Array<Record<string, unknown>> = [];
  if (email) orFilters.push({ email });
  if (phoneNumber) orFilters.push({ phoneNumber });

  if (!orFilters.length) return null;
  return CustomerModel.findOne({ $or: orFilters, isDeleted: false });
};

const resolveSourceUserId = async ({
  sourceUserIdInput,
  email,
  phoneNumber,
}: {
  sourceUserIdInput?: string | mongoose.Types.ObjectId;
  email?: string;
  phoneNumber?: string;
}): Promise<mongoose.Types.ObjectId | null> => {
  const sourceUserId = toObjectIdOrNull(sourceUserIdInput);
  if (sourceUserId) {
    const existingUser = await UserModel.findById(sourceUserId).select('_id').lean();
    return existingUser?._id instanceof mongoose.Types.ObjectId ? existingUser._id : null;
  }

  const userFilters: Array<Record<string, unknown>> = [];
  if (email) userFilters.push({ $or: [{ email }, { [LEGACY_USER_EMAIL_FIELD]: email }] });
  if (phoneNumber) userFilters.push({ $or: [{ phoneNumber }, { phone: phoneNumber }] });
  if (!userFilters.length) return null;

  const matchedUser = await UserModel.findOne({ $or: userFilters }).select('_id').lean();
  return matchedUser?._id instanceof mongoose.Types.ObjectId ? matchedUser._id : null;
};

const validateCreatePayload = (payload: CreateCustomerBody) => {
  const fullName = String(payload.fullName ?? '').trim();
  const email = normalizeEmail(payload.email);
  const phoneNumber = normalizeMobileNumber(payload.phoneNumber);
  const sourceUserId = toObjectIdOrNull(payload.sourceUserId);

  if (!fullName && !sourceUserId)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Customer name is required',
      undefined,
      true,
      '',
      responseCodes.CustomerResponseCodes.INVALID_FIELDS,
    );
  if (!email && !phoneNumber && !sourceUserId)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Provide source user or at least one contact field (email or phone)',
      undefined,
      true,
      '',
      responseCodes.CustomerResponseCodes.INVALID_FIELDS,
    );

  return { fullName, email, phoneNumber, sourceUserId };
};

const createOrGetCustomer = async (
  payload: CreateCustomerBody,
  returnExistingIfDuplicate = true,
): Promise<CreateCustomerResult> => {
  const validated = validateCreatePayload(payload);
  const sourceUserId = await resolveSourceUserId({
    sourceUserIdInput: payload.sourceUserId,
    email: validated.email,
    phoneNumber: validated.phoneNumber,
  });
  const fullName = validated.fullName || String(payload.fullName ?? '').trim();
  const email = validated.email;
  const phoneNumber = validated.phoneNumber;

  const existing = await findCustomerByUniqueFields({ sourceUserId, email, phoneNumber });

  if (existing) {
    if (sourceUserId && !existing.sourceUserId) {
      existing.sourceUserId = sourceUserId;
      await existing.save();
    }
    if (returnExistingIfDuplicate) return { customer: existing, created: false };
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Customer already exists',
      undefined,
      true,
      '',
      responseCodes.CustomerResponseCodes.ALREADY_EXISTS,
    );
  }

  const created = await CustomerModel.create({
    fullName: fullName || 'Customer',
    sourceUserId: sourceUserId || undefined,
    email: email || undefined,
    phoneNumber: phoneNumber || undefined,
    dialCode: normalizeDialCode(payload.dialCode) ?? 91,
    address: String(payload.address ?? '').trim() || undefined,
    birthdate: normalizeBirthdateInput(payload.birthdate),
    profileImage: String(payload.profileImage ?? '').trim() || undefined,
    status: normalizeStatus(payload.status),
    isDeleted: false,
  });
  return {
    customer: (await getCustomerById(created._id)) ?? created,
    created: true,
  };
};
const createCustomer = async (payload: CreateCustomerBody): Promise<CreateCustomerResult> =>
  createOrGetCustomer(payload, false);

const queryCustomers = async (
  filter: Record<string, unknown>,
  options: PaginateOptions,
): Promise<QueryResult<ICustomerDoc>> =>
  CustomerModel.paginate(
    {
      ...filter,
      isDeleted: false,
    },
    {
      ...(options as Record<string, unknown>),
      sortBy: options.sortBy || 'createdAt:desc',
    },
  );

const updateCustomerById = async (
  customerId: mongoose.Types.ObjectId,
  body: UpdateCustomerBody,
): Promise<ICustomerDoc | null> => {
  const customer = await getCustomerById(customerId);
  if (!customer)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Customer not found',
      undefined,
      true,
      '',
      responseCodes.CustomerResponseCodes.NOT_FOUND,
    );

  const updatePayload: Record<string, unknown> = { ...body };
  if (body.sourceUserId !== undefined) updatePayload.sourceUserId = toObjectIdOrNull(body.sourceUserId) || undefined;
  if (body.email !== undefined) updatePayload.email = normalizeEmail(body.email) || undefined;
  if (body.phoneNumber !== undefined) updatePayload.phoneNumber = normalizeMobileNumber(body.phoneNumber) || undefined;
  if (body.dialCode !== undefined) updatePayload.dialCode = normalizeDialCode(body.dialCode) ?? undefined;
  if (body.birthdate !== undefined) updatePayload.birthdate = normalizeBirthdateInput(body.birthdate);
  if (body.status !== undefined) updatePayload.status = normalizeStatus(body.status);

  const sourceUserId =
    updatePayload.sourceUserId instanceof mongoose.Types.ObjectId ? updatePayload.sourceUserId : undefined;
  const email = typeof updatePayload.email === 'string' ? updatePayload.email : '';
  const phone = typeof updatePayload.phoneNumber === 'string' ? updatePayload.phoneNumber : '';

  if (sourceUserId) {
    const linkedCustomer = await CustomerModel.findOne({
      sourceUserId,
      _id: { $ne: customerId },
      isDeleted: false,
    }).select('_id');
    if (linkedCustomer)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Source user already linked with another customer',
        undefined,
        true,
        '',
        responseCodes.CustomerResponseCodes.ALREADY_EXISTS,
      );
  }

  if (email && (await CustomerModel.isEmailTaken(email, customerId)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already taken',
      undefined,
      true,
      '',
      responseCodes.CustomerResponseCodes.ALREADY_EXISTS,
    );
  if (phone && (await CustomerModel.isMobileNumberTaken(phone, customerId)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Phone already taken',
      undefined,
      true,
      '',
      responseCodes.CustomerResponseCodes.ALREADY_EXISTS,
    );

  Object.assign(customer, updatePayload);
  await customer.save();
  return getCustomerById(customer._id);
};

const updateCustomerStatusById = async (
  customerId: mongoose.Types.ObjectId,
  status: 'active' | 'inactive' | 'locked',
): Promise<ICustomerDoc | null> => updateCustomerById(customerId, { status });

const deleteCustomerById = async (customerId: mongoose.Types.ObjectId): Promise<ICustomerDoc | null> => {
  const customer = await getCustomerById(customerId);
  if (!customer)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Customer not found',
      undefined,
      true,
      '',
      responseCodes.CustomerResponseCodes.NOT_FOUND,
    );

  customer.isDeleted = true;
  customer.status = 'inactive';
  await customer.save();
  return customer;
};

export const customerService = {
  createCustomer,
  createOrGetCustomer,
  queryCustomers,
  getCustomerById,
  findCustomerBySourceUserId,
  updateCustomerById,
  updateCustomerStatusById,
  deleteCustomerById,
};
