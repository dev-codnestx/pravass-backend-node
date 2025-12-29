import { Request, Response, NextFunction } from 'express';

// TODO: later add correct type
/* eslint-disable @typescript-eslint/no-explicit-any */

const catchAsync =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };

export default catchAsync;
