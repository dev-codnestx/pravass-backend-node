import httpStatus from 'http-status';
import mongoose from 'mongoose';

import { UserModel } from '@/modules/user/user.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { IRole, IRolePermission, RoleModel } from './role.model.js';

type RoleStatus = IRole['status'];

type RoleInput = {
  name?: string;
  code?: string;
  description?: string;
  permissions?: unknown;
  status?: string;
  isSystem?: boolean;
};

type RoleListOptions = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type FlattenedRolePermission = {
  roleId: string;
  module: string;
  action: string;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeText = (value: unknown) => String(value ?? '').trim();

const normalizeStatus = (value: unknown, fallback: RoleStatus = 'active'): RoleStatus => {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'inactive') return 'inactive';
  return fallback;
};

const normalizeRoleCode = (value: unknown, fallback = '') => {
  const normalized = normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || fallback;
};

const normalizeRolePermissions = (permissions: unknown): IRolePermission[] => {
  if (!Array.isArray(permissions)) return [];

  const entries = new Map<string, Set<string>>();

  permissions.forEach((permission) => {
    if (!permission || typeof permission !== 'object') return;

    const candidate = permission as Record<string, unknown>;
    const moduleName = normalizeText(candidate.module ?? candidate.moduleName);
    if (!moduleName) return;

    const rawActions = Array.isArray(candidate.actions) ? candidate.actions : candidate.action ? [candidate.action] : [];

    if (!entries.has(moduleName)) entries.set(moduleName, new Set<string>());
    const actions = entries.get(moduleName)!;

    rawActions.forEach((actionItem) => {
      const action = normalizeText(actionItem);
      if (action) actions.add(action);
    });
  });

  return Array.from(entries.entries())
    .map(([module, actions]) => ({
      module,
      actions: Array.from(actions),
    }))
    .filter((permission) => permission.actions.length > 0);
};

const PERMISSION_CATALOG_MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'masters', label: 'Masters' },
  { key: 'tours', label: 'Tours Management' },
  { key: 'speciality-tours', label: 'Speciality Tours' },
  { key: 'deals', label: 'Deals & Offers' },
  { key: 'blogs', label: 'Blogs & FAQs' },
  { key: 'crm', label: 'CRM / Enquiries' },
  { key: 'customers', label: 'Customers' },
  { key: 'careers', label: 'Careers' },
  { key: 'support', label: 'Support Tickets' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'banners', label: 'Banner Management' },
  { key: 'website-users', label: 'Website Users' },
  { key: 'settings', label: 'Settings' },
  { key: 'employee-management', label: 'Employee Management' },
] as const;

const PERMISSION_CATALOG_ACTIONS = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
] as const;

const PERMISSION_CATALOG_MODULE_ACTIONS: Record<string, string[]> = {
  dashboard: ['read'],
  masters: ['create', 'read', 'update', 'delete'],
  tours: ['create', 'read', 'update', 'delete'],
  'speciality-tours': ['create', 'read', 'update', 'delete'],
  deals: ['create', 'read', 'update', 'delete'],
  blogs: ['create', 'read', 'update', 'delete'],
  crm: ['create', 'read', 'update', 'delete'],
  customers: ['create', 'read', 'update', 'delete'],
  careers: ['create', 'read', 'update', 'delete'],
  support: ['create', 'read', 'update', 'delete'],
  testimonials: ['create', 'read', 'update', 'delete'],
  reports: ['create', 'read', 'update', 'delete'],
  banners: ['create', 'read', 'update', 'delete'],
  'website-users': ['read', 'update', 'resendMail'],
  settings: ['create', 'read', 'update', 'delete'],
  'employee-management': ['create', 'read', 'update', 'delete'],
};

const normalizePermissionKey = (value: string) => normalizeText(value).toLowerCase();

const isAllowedPermissionAction = (module: string, action: string) => {
  const allowedActions =
    PERMISSION_CATALOG_MODULE_ACTIONS[normalizePermissionKey(module)] ?? PERMISSION_CATALOG_ACTIONS.map((item) => item.key);
  return allowedActions.includes(normalizePermissionKey(action));
};

const flattenRolePermissions = (roleId: string, permissions: IRolePermission[] | undefined): FlattenedRolePermission[] =>
  (permissions ?? []).flatMap((permission) =>
    (permission.actions ?? [])
      .filter((action) => isAllowedPermissionAction(permission.module, action))
      .map((action) => ({
        roleId,
        module: permission.module,
        action,
      })),
  );

const toRoleResponse = (role: IRole & mongoose.Document, totalUsers = 0) => ({
  id: String(role._id),
  name: role.name,
  code: role.code,
  description: role.description ?? '',
  permissions: Array.isArray(role.permissions)
    ? role.permissions.map((permission) => ({
        module: permission.module,
        actions: Array.isArray(permission.actions) ? [...permission.actions] : [],
      }))
    : [],
  isSystem: Boolean(role.isSystem),
  status: role.status,
  totalUsers,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

const getRoleUserCountMap = async (roleIds?: string[]) => {
  const pipeline: mongoose.PipelineStage[] = [];
  if (roleIds?.length)
    pipeline.push({
      $match: {
        roleId: {
          $in: roleIds.map((roleId) => new mongoose.Types.ObjectId(roleId)),
        },
      },
    });

  pipeline.push({
    $group: {
      _id: '$roleId',
      totalUsers: { $sum: 1 },
    },
  });

  const result = await UserModel.aggregate(pipeline);
  return new Map<string, number>(result.map((item) => [String(item._id), Number(item.totalUsers ?? 0)]));
};

const findRoleByNameOrCode = async (name: string, code: string, excludeId?: string) => {
  const candidates: Record<string, unknown>[] = [{ code }, { name: new RegExp(`^${escapeRegex(name)}$`, 'i') }];

  if (excludeId)
    return RoleModel.findOne({
      _id: { $ne: excludeId },
      $or: candidates,
    });

  return RoleModel.findOne({ $or: candidates });
};

const resolveRolePayload = (body: RoleInput, existing?: IRole | null) => {
  const payload: Record<string, unknown> = {};

  if (body.name !== undefined) payload.name = normalizeText(body.name);
  if (body.code !== undefined) payload.code = normalizeRoleCode(body.code);
  if (body.description !== undefined) payload.description = normalizeText(body.description);
  if (body.status !== undefined) payload.status = normalizeStatus(body.status, existing?.status ?? 'active');
  if (body.permissions !== undefined) payload.permissions = normalizeRolePermissions(body.permissions);
  if (body.isSystem !== undefined) payload.isSystem = Boolean(body.isSystem);

  return payload;
};

const getRoleOrThrow = async (roleId: string) => {
  const role = await RoleModel.findById(roleId);
  if (!role)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Role not found',
      undefined,
      true,
      '',
      responseCodes.RoleResponseCodes.NOT_FOUND,
    );

  return role;
};

const ensureRoleNotAssigned = async (roleId: string) => {
  const count = await UserModel.countDocuments({ roleId });
  if (count > 0)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Role is assigned to users',
      undefined,
      true,
      '',
      responseCodes.RoleResponseCodes.IN_USE,
    );
};

export const listRoles = async (options: RoleListOptions = {}) => {
  const page = Math.max(Number(options.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit ?? 20) || 20, 1), 100);
  const search = normalizeText(options.search);
  const status = normalizeText(options.status).toLowerCase();

  const query: Record<string, unknown> = {};
  if (search)
    query.$or = [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { code: { $regex: escapeRegex(search), $options: 'i' } },
      { description: { $regex: escapeRegex(search), $options: 'i' } },
    ];

  if (status === 'active' || status === 'inactive') query.status = status;

  const skip = (page - 1) * limit;
  const [roles, totalResults, totalUsers] = await Promise.all([
    RoleModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    RoleModel.countDocuments(query),
    getRoleUserCountMap(),
  ]);

  const results = roles.map((role) =>
    toRoleResponse(role as IRole & mongoose.Document, totalUsers.get(String(role._id)) ?? 0),
  );

  return {
    results,
    page,
    limit,
    totalResults,
    totalPages: Math.ceil(totalResults / limit),
  };
};

export const listPermissions = async () => {
  const roles = await RoleModel.find({}, { permissions: 1 }).sort({ createdAt: -1 }).lean();
  return roles.flatMap((role) =>
    flattenRolePermissions(String(role._id), role.permissions as IRolePermission[] | undefined),
  );
};

export const getRolePermissions = async (roleId: string) => {
  const role = await RoleModel.findById(roleId, { permissions: 1 }).lean();
  if (!role) return null;

  return {
    roleId,
    permissions: flattenRolePermissions(roleId, role.permissions as IRolePermission[] | undefined),
  };
};

export const getPermissionCatalog = () => ({
  modules: [...PERMISSION_CATALOG_MODULES],
  actions: [...PERMISSION_CATALOG_ACTIONS],
  moduleActions: Object.fromEntries(
    PERMISSION_CATALOG_MODULES.map((module) => [
      module.key,
      (PERMISSION_CATALOG_MODULE_ACTIONS[module.key] ?? PERMISSION_CATALOG_ACTIONS.map((action) => action.key)).map(
        (action) => ({
          key: action,
          label: action.charAt(0).toUpperCase() + action.slice(1),
        }),
      ),
    ]),
  ),
});

export const getRoleById = async (roleId: string) => {
  const role = await RoleModel.findById(roleId);
  if (!role) return null;

  const totalUsers = await UserModel.countDocuments({ roleId });
  return toRoleResponse(role, totalUsers);
};

export const createRole = async (body: RoleInput, userId?: string) => {
  const name = normalizeText(body.name);
  if (!name)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Role name is required',
      undefined,
      true,
      '',
      responseCodes.RoleResponseCodes.INVALID_FIELDS,
    );

  const code = normalizeRoleCode(body.code, normalizeRoleCode(name));
  const existingRole = await findRoleByNameOrCode(name, code);
  if (existingRole)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Role name or code already exists',
      undefined,
      true,
      '',
      responseCodes.RoleResponseCodes.ALREADY_EXISTS,
    );

  const payload = resolveRolePayload(body);
  payload.name = name;
  payload.code = code;
  payload.status = normalizeStatus(body.status, 'active');
  payload.permissions = normalizeRolePermissions(body.permissions);
  if (userId) {
    payload.createdBy = userId;
    payload.updatedBy = userId;
  }

  try {
    const created = await RoleModel.create(payload);
    const totalUsers = await UserModel.countDocuments({ roleId: created._id });
    return toRoleResponse(created, totalUsers);
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Role name or code already exists',
        undefined,
        true,
        '',
        responseCodes.RoleResponseCodes.ALREADY_EXISTS,
      );

    throw error;
  }
};

export const updateRole = async (roleId: string, body: RoleInput, userId?: string) => {
  const role = await getRoleOrThrow(roleId);
  const payload = resolveRolePayload(body, role);

  if (!Object.keys(payload).length)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'At least one updatable field is required',
      undefined,
      true,
      '',
      responseCodes.RoleResponseCodes.INVALID_FIELDS,
    );

  if (role.isSystem && payload.code && payload.code !== role.code)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'System role code cannot be changed',
      undefined,
      true,
      '',
      responseCodes.RoleResponseCodes.INVALID_FIELDS,
    );

  const nextName = typeof payload.name === 'string' ? payload.name : role.name;
  const nextCode = typeof payload.code === 'string' ? payload.code : role.code;
  const duplicate = await findRoleByNameOrCode(nextName, nextCode, roleId);
  if (duplicate)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Role name or code already exists',
      undefined,
      true,
      '',
      responseCodes.RoleResponseCodes.ALREADY_EXISTS,
    );

  if (userId) payload.updatedBy = userId;

  try {
    const updated = await RoleModel.findByIdAndUpdate(roleId, { $set: payload }, { new: true, runValidators: true });
    if (!updated)
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Role not found',
        undefined,
        true,
        '',
        responseCodes.RoleResponseCodes.NOT_FOUND,
      );

    const totalUsers = await UserModel.countDocuments({ roleId: updated._id });
    return toRoleResponse(updated, totalUsers);
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Role name or code already exists',
        undefined,
        true,
        '',
        responseCodes.RoleResponseCodes.ALREADY_EXISTS,
      );

    throw error;
  }
};

export const replaceRolePermissions = async (roleId: string, permissions: unknown, userId?: string) => {
  await getRoleOrThrow(roleId);
  const nextPermissions = normalizeRolePermissions(permissions);

  const updated = await RoleModel.findByIdAndUpdate(
    roleId,
    {
      $set: {
        permissions: nextPermissions,
        ...(userId ? { updatedBy: userId } : {}),
      },
    },
    { new: true, runValidators: true },
  );

  if (!updated)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Role not found',
      undefined,
      true,
      '',
      responseCodes.RoleResponseCodes.NOT_FOUND,
    );

  const totalUsers = await UserModel.countDocuments({ roleId: updated._id });
  return toRoleResponse(updated, totalUsers);
};

export const deleteRole = async (roleId: string) => {
  const role = await getRoleOrThrow(roleId);

  if (role.isSystem)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'System roles cannot be deleted',
      undefined,
      true,
      '',
      responseCodes.RoleResponseCodes.INVALID_FIELDS,
    );

  await ensureRoleNotAssigned(roleId);

  await RoleModel.findByIdAndDelete(roleId);
};
