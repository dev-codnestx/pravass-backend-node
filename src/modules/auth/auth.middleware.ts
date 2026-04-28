import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import passport from 'passport';

import { IUserDoc } from '@/modules/user/user.interfaces.js';
import ApiError from '@/shared/utils/errors/ApiError.js';

type AuthOptions = {
  allowGuestFor?: string[];
  allowedClientTypes?: string[];
};

type RolePermission = {
  module?: string;
  actions?: string[];
};

type RoleLike = {
  code?: string;
  permissions?: RolePermission[];
};

const getClientType = (req: Request): string => (req.headers['x-client-type'] as string) || '';

const resolveRole = (user: IUserDoc): RoleLike | null => {
  const anyUser = user as IUserDoc & { role?: RoleLike; roleId?: RoleLike | string };

  if (anyUser?.role && typeof anyUser.role === 'object') return anyUser.role;
  if (anyUser?.roleId && typeof anyUser.roleId === 'object') return anyUser.roleId;

  return null;
};

const hasRequiredRights = (user: IUserDoc, requiredRights: string[]): boolean => {
  if (!requiredRights.length) return true;

  const role = resolveRole(user);
  if (role?.code === 'SUPER_ADMIN') return true;

  const permissions = Array.isArray(role?.permissions) ? role.permissions : [];

  return requiredRights.every((right) => {
    const [module, action] = right.split(':');
    if (!module || !action) return false;

    return permissions.some(
      (perm) => perm.module === module && Array.isArray(perm.actions) && perm.actions.includes(action),
    );
  });
};

const extractOptionsAndRights = (args: Array<AuthOptions | string>): { options?: AuthOptions; requiredRights: string[] } => {
  if (!args.length) return { requiredRights: [] };

  const [firstArg, ...rest] = args;

  if (typeof firstArg === 'string') return { requiredRights: [firstArg, ...(rest as string[])] };

  return { options: firstArg, requiredRights: rest as string[] };
};

const authMiddleware =
  (...args: Array<AuthOptions | string>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { options, requiredRights } = extractOptionsAndRights(args);

    const clientType = getClientType(req);
    const allowGuestTypes = options?.allowGuestFor ?? [];
    const allowGuest = allowGuestTypes.includes(clientType);

    passport.authenticate('jwt', { session: false }, (err: Error | null, user: IUserDoc | null, info: unknown) => {
      if (!allowGuest) {
        if (err || info || !user) return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));

        if (!hasRequiredRights(user, requiredRights)) return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));

        req.user = user;
        return next();
      }

      if (user) {
        req.user = user;

        if (!hasRequiredRights(user, requiredRights)) return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }

      return next();
    })(req, res, next);
  };

export default authMiddleware;
