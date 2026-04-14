import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

import catchAsync from '@/shared/utils/catchAsync.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import pick from '@/shared/utils/pick.js';
import { PaginateOptions } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { userService } from './index.js';

const assertValidUserId = (userId: unknown) => {
  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId))
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user id');

  return new mongoose.Types.ObjectId(userId);
};

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).success({ user }, responseCodes.UserResponseCodes.SUCCESS, 'User created successfully');
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
  const roleId =
    typeof req.query.roleId === 'string'
      ? req.query.roleId.trim()
      : typeof req.query.role === 'string'
        ? req.query.role.trim()
        : '';

  if (search)
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
    ];
  else if (name) filter.fullName = { $regex: name, $options: 'i' };

  if (roleId) filter.roleId = mongoose.Types.ObjectId.isValid(roleId) ? new mongoose.Types.ObjectId(roleId) : roleId;

  const options: PaginateOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy', 'populate']);
  if (!options.populate) options.populate = 'roleId:name,code,description,permissions,isSystem,status';
  const result = await userService.queryUsers(filter, options);
  res.success(result, responseCodes.UserResponseCodes.SUCCESS, 'Users fetched successfully');
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  const userId = assertValidUserId(req.params['userId']);
  const user = await userService.getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  res.success({ user }, responseCodes.UserResponseCodes.SUCCESS, 'User fetched successfully');
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = assertValidUserId(req.params['userId']);
  const user = await userService.updateUserById(userId, req.body);
  res.success({ user }, responseCodes.UserResponseCodes.SUCCESS, 'User updated successfully');
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = assertValidUserId(req.params['userId']);
  await userService.deleteUserById(userId);
  res.success(null, responseCodes.UserResponseCodes.SUCCESS, 'User deleted successfully');
});
