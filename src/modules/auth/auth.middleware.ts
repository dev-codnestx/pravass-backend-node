import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import passport from 'passport';

import { IUserDoc } from '@/modules/user/user.interfaces.js';
import ApiError from '@/shared/utils/errors/ApiError.js';

const verifyCallback =
  (req: Request, resolve: () => void, reject: (_err: ApiError) => void, _requiredRights: string[]) =>
  async (err: Error | null, user: IUserDoc | null, _info: string) => {
    if (err || _info || !user) return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));

    req.user = user;

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
