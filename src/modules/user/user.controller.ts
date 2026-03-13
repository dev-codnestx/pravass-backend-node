import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

import catchAsync from '@/shared/utils/catchAsync.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import pick from '@/shared/utils/pick.js';
import { PaginateOptions } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { userService } from './index.js';

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).success({ user }, responseCodes.UserResponseCodes.SUCCESS, 'User created successfully');
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'role']);
  const options: PaginateOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await userService.queryUsers(filter, options);
  res.success(result, responseCodes.UserResponseCodes.SUCCESS, 'Users fetched successfully');
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['userId'] === 'string') {
    const user = await userService.getUserById(new mongoose.Types.ObjectId(req.params['userId']));
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

    res.success({ user }, responseCodes.UserResponseCodes.SUCCESS, 'User fetched successfully');
  }
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['userId'] === 'string') {
    const user = await userService.updateUserById(new mongoose.Types.ObjectId(req.params['userId']), req.body);
    res.success({ user }, responseCodes.UserResponseCodes.SUCCESS, 'User updated successfully');
  }
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['userId'] === 'string') {
    await userService.deleteUserById(new mongoose.Types.ObjectId(req.params['userId']));
    res.success(null, responseCodes.UserResponseCodes.SUCCESS, 'User deleted successfully');
  }
});
