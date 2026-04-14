import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '@/shared/utils/catchAsync.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { createRole, deleteRole, getRoleById, listRoles, replaceRolePermissions, updateRole } from './role.service.js';

const getUserId = (req: Request) => (req.user?._id ? String(req.user._id) : undefined);

export const list = catchAsync(async (req: Request, res: Response) => {
  const result = await listRoles({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 20),
    search:
      typeof req.query.search === 'string' ? req.query.search : typeof req.query.name === 'string' ? req.query.name : '',
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
  });

  res.success(result, responseCodes.RoleResponseCodes.SUCCESS, 'Roles fetched successfully');
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const role = await getRoleById(req.params.roleId);
  if (!role)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Role not found',
      undefined,
      true,
      '',
      responseCodes.RoleResponseCodes.NOT_FOUND,
    );

  res.success({ role }, responseCodes.RoleResponseCodes.SUCCESS, 'Role fetched successfully');
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const role = await createRole(req.body, getUserId(req));
  res.status(httpStatus.CREATED).success({ role }, responseCodes.RoleResponseCodes.SUCCESS, 'Role created successfully');
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const role = await updateRole(req.params.roleId, req.body, getUserId(req));
  res.success({ role }, responseCodes.RoleResponseCodes.SUCCESS, 'Role updated successfully');
});

export const updatePermissions = catchAsync(async (req: Request, res: Response) => {
  const role = await replaceRolePermissions(req.params.roleId, req.body.permissions, getUserId(req));
  res.success({ role }, responseCodes.RoleResponseCodes.SUCCESS, 'Role permissions updated successfully');
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await deleteRole(req.params.roleId);
  res.success(null, responseCodes.RoleResponseCodes.SUCCESS, 'Role deleted successfully');
});
