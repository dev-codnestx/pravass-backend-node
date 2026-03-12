import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import config from '@/shared/config/config.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { defaultStatus, status } from '@/shared/utils/responseCode/httpStatusAlias.js';

export const errorConverter = (err: unknown, _req: Request, _res: Response, next: NextFunction): void => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      (error as { statusCode?: number }).statusCode ||
      (error instanceof mongoose.Error ? defaultStatus.BAD_REQUEST : defaultStatus.INTERNAL_SERVER_ERROR);
    const message = (error as { message?: string }).message || status[statusCode] || 'Unexpected error';
    error = new ApiError(statusCode, message, error as Error, true, (error as { stack?: string }).stack);
  }
  next(error);
};

export const errorHandler = (err: ApiError, _req: Request, res: Response, _next: NextFunction): void => {
  let { statusCode } = err;

  if (config.env === 'production' && !err.isOperational) {
    const prodErrorCode = defaultStatus.INTERNAL_SERVER_ERROR;
    const prodMessage = status[defaultStatus.INTERNAL_SERVER_ERROR] || 'Internal Server Error';

    res.locals.errorMessage = err.message;

    const response = {
      code: prodErrorCode,
      message: prodMessage,
      data: {},
      success: false,
      ...(config.env === 'development' && { err: err.stack }),
    };

    if (config.env === 'development') console.warn(err);

    res.status(statusCode).send(response);
  }
};
