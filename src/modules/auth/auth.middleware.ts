import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import httpStatus from 'http-status';

import { IUserDoc } from '@/modules/user/user.interfaces.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { CLIENT_TYPE_HEADER, DEFAULT_CLIENT_TYPE } from '@/modules/auth/auth.constants.js';

type AuthMiddlewareOptions = {
  allowedClientTypes?: readonly string[];
};

const isAuthOptions = (value: unknown): value is AuthMiddlewareOptions =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const authMiddleware =
  (...args: (string | AuthMiddlewareOptions)[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const [options, requiredRights] = isAuthOptions(args[0]) ? [args[0], args.slice(1) as string[]] : [{}, args as string[]];
    console.log('🚀 ~ authMiddleware ~ requiredRights:', requiredRights);

    // Handle undefined options safely
    const allowedClientTypes = new Set(
      (options?.allowedClientTypes || []).map((c) => c.toLowerCase().trim()).filter(Boolean),
    );

    const clientType = req.get(CLIENT_TYPE_HEADER)?.toLowerCase().trim() || DEFAULT_CLIENT_TYPE;

    // Only skip auth IF allowedClientTypes is provided AND matches
    if (options?.allowedClientTypes?.length && allowedClientTypes.has(clientType)) return next();

    // Otherwise → normal auth flow (no breaking)
    passport.authenticate('jwt', { session: false }, (err: Error | null, user: IUserDoc | null, info: any) => {
      if (err || info || !user) return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));

      req.user = user;

      // Optional RBAC hook. Keeping parity with previous behavior:
      // requiredRights are accepted in middleware signature but not enforced here.
      // if (!hasPermissions(user, requiredRights)) {
      //   return next(new ApiError(httpStatus.FORBIDDEN, "Forbidden"));
      // }

      return next();
    })(req, res, next);
  };

export default authMiddleware;
