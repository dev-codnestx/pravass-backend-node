import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { IUserDoc } from '@/modules/user/user.interfaces.js';

const verifyCallback =
  (req: Request, resolve: () => void, reject: (_err: ApiError) => void, requiredRights: string[]) =>
  async (err: Error | null, user: IUserDoc | null, info: string) => {
    if (err || info || !user) return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));

    req.user = user;

    // if (requiredRights.length) {
    //   const userRights = roleRights.get(user.role) || [];
    //   const hasRequiredRights = requiredRights.every((right) => userRights.includes(right));
    //   const isSelf = req.params['userId'] === user.id;

    //   if (!hasRequiredRights && !isSelf) return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    // }

    resolve();
  };

const authMiddleware =
  (...requiredRights: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    new Promise<void>((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default authMiddleware;
