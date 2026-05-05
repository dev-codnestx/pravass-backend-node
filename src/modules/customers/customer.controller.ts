import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

import catchAsync from '@/shared/utils/catchAsync.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import pick from '@/shared/utils/pick.js';
import { PaginateOptions } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { customerService } from './customer.service.js';
import UserModel from '@/modules/user/user.model.js';

const assertValidCustomerId = (customerId: unknown) => {
  if (typeof customerId !== 'string' || !mongoose.Types.ObjectId.isValid(customerId))
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid customer id');

  return new mongoose.Types.ObjectId(customerId);
};

const normalizeStatusQuery = (value: unknown) => {
  if (typeof value !== 'string') return '';

  const normalized = value.trim().toLowerCase();
  return ['active', 'inactive', 'locked'].includes(normalized) ? normalized : '';
};

const createCustomer = catchAsync(async (req: Request, res: Response) => {
  const result = await customerService.createCustomer(req.body);
  return res
    .status(httpStatus.CREATED)
    .success(result, responseCodes.CustomerResponseCodes.SUCCESS, 'Customer created successfully');
});

const getCustomers = catchAsync(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const status = normalizeStatusQuery(req.query.status);

  if (search)
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
    ];
  if (status) filter.status = status;

  const options: PaginateOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy', 'populate']);
  const result = await customerService.queryCustomers(filter, options);
  return res.success(result, responseCodes.CustomerResponseCodes.SUCCESS, 'Customers fetched successfully');
});

const getCustomer = catchAsync(async (req: Request, res: Response) => {
  const customerId = assertValidCustomerId(req.params['customerId']);
  const customer = await customerService.getCustomerById(customerId);
  if (!customer)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Customer not found',
      undefined,
      true,
      '',
      responseCodes.CustomerResponseCodes.NOT_FOUND,
    );

  return res.success({ customer }, responseCodes.CustomerResponseCodes.SUCCESS, 'Customer fetched successfully');
});

const updateCustomer = catchAsync(async (req: Request, res: Response) => {
  const customerId = assertValidCustomerId(req.params['customerId']);
  const customer = await customerService.updateCustomerById(customerId, req.body);
  return res.success({ customer }, responseCodes.CustomerResponseCodes.SUCCESS, 'Customer updated successfully');
});

const updateCustomerStatus = catchAsync(async (req: Request, res: Response) => {
  const customerId = assertValidCustomerId(req.params['customerId']);
  const status = normalizeStatusQuery(req.body.status) as 'active' | 'inactive' | 'locked';
  const customer = await customerService.updateCustomerStatusById(customerId, status);
  return res.success({ customer }, responseCodes.CustomerResponseCodes.SUCCESS, 'Customer status updated successfully');
});

const deleteCustomer = catchAsync(async (req: Request, res: Response) => {
  const customerId = assertValidCustomerId(req.params['customerId']);
  await customerService.deleteCustomerById(customerId);
  return res.success(null, responseCodes.CustomerResponseCodes.SUCCESS, 'Customer deleted successfully');
});

const toggleWishlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id || req.user?.id;
  const user = await UserModel.findById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const tourId = req.body.tourId;
  const tourObjectId = new mongoose.Types.ObjectId(tourId);
  const wishlist = user.wishlist || [];
  const index = wishlist.findIndex((id) => id.toString() === tourId);

  if (index === -1) wishlist.push(tourObjectId);
  else wishlist.splice(index, 1);

  user.wishlist = wishlist;
  await user.save();

  return res.success(user.wishlist, responseCodes.CustomerResponseCodes.SUCCESS, 'Wishlist updated successfully');
});

const getWishlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id || req.user?.id;
  const user = await UserModel.findById(userId).populate({
    path: 'wishlist',
    populate: [{ path: 'tourType' }, { path: 'destinationIds' }, { path: 'inclusionIds' }],
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  return res.success(user.wishlist || [], responseCodes.CustomerResponseCodes.SUCCESS, 'Wishlist fetched successfully');
});

export const customerController = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
  toggleWishlist,
  getWishlist,
};
