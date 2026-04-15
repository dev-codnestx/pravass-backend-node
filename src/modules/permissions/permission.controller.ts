import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '@/shared/utils/catchAsync.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import {
  getPermissionCatalog,
  getRolePermissions,
  listPermissions,
  replaceRolePermissions,
} from '@/modules/roles/role.service.js';

const getUserId = (req: Request) => (req.user?._id ? String(req.user._id) : undefined);

export const list = catchAsync(async (_req: Request, res: Response) => {
  const page = Math.max(Number(_req.query.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(_req.query.limit ?? 200) || 200, 1), 500);
  const permissions = await listPermissions();
  const start = (page - 1) * limit;
  const pagedPermissions = permissions.slice(start, start + limit);

  res.success(
    {
      permissions: pagedPermissions,
      totalResults: permissions.length,
      totalPages: Math.ceil(permissions.length / limit) || 1,
      page,
      limit,
    },
    responseCodes.PermissionResponseCodes.SUCCESS,
    'Permissions fetched successfully',
  );
});

export const catalog = catchAsync(async (_req: Request, res: Response) => {
  res.success(
    getPermissionCatalog(),
    responseCodes.PermissionResponseCodes.SUCCESS,
    'Permission catalog fetched successfully',
  );
});

export const getByRole = catchAsync(async (req: Request, res: Response) => {
  const rolePermissions = await getRolePermissions(req.params.roleId);
  if (!rolePermissions) {
    res.success(
      { roleId: req.params.roleId, permissions: [] },
      responseCodes.PermissionResponseCodes.SUCCESS,
      'Permissions fetched successfully',
    );
    return;
  }

  res.success(rolePermissions, responseCodes.PermissionResponseCodes.SUCCESS, 'Permissions fetched successfully');
});

export const updateByRole = catchAsync(async (req: Request, res: Response) => {
  const permissions = await replaceRolePermissions(req.params.roleId, req.body.permissions, getUserId(req));
  res
    .status(httpStatus.OK)
    .success({ role: permissions }, responseCodes.PermissionResponseCodes.SUCCESS, 'Permissions updated successfully');
});
