import { Request, Response, NextFunction } from 'express';

export const setAuditFields = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user && req.body && typeof req.body === 'object')
    if (req.method === 'POST') {
      req.body.createdBy = req.user.id;
      req.body.updatedBy = req.user.id;
    } else if (req.method === 'PATCH' || req.method === 'PUT') {
      req.body.updatedBy = req.user.id;
    }

  next();
};
