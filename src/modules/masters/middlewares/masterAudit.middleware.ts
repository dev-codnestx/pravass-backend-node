import type { NextFunction, Request, Response } from 'express';

export const injectMasterAuditFields = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user?.id || !req.body || typeof req.body !== 'object') {
    next();
    return;
  }

  if (req.method === 'POST') {
    req.body.createdBy = req.user.id;
    req.body.updatedBy = req.user.id;
  }

  if (req.method === 'PUT' || req.method === 'PATCH') req.body.updatedBy = req.user.id;

  next();
};
