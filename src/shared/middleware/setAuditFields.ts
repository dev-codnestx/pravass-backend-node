import { Request, Response, NextFunction } from 'express';
import { AuditMode, AuditModeType } from '../constants/enum.constant.js';

type SetAuditOpts = {
  mode: AuditModeType;
};

export const setAuditFields = (options: SetAuditOpts) => (req: Request, _res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  if (!userId) return next();

  if (!req.body) req.body = {};

  if (options.mode === AuditMode.CREATE) {
    req.body.createdBy = userId;
    req.body.updatedBy = userId;
  } else if (options.mode === AuditMode.UPDATE) {
    req.body.updatedBy = userId;
  }

  next();
};
