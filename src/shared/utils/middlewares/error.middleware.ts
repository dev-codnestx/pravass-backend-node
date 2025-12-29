import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import ApiError from '@/shared/utils/errors/ApiError.js';
import { defaultStatus, status } from '@/shared/utils/responseCode/httpStatusAlias.js';
import config from '@/shared/config/config.js';

export const errorConverter = (err: any, req: Request, res: Response, next: NextFunction): void => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode ||
      (error instanceof mongoose.Error ? defaultStatus.BAD_REQUEST : defaultStatus.INTERNAL_SERVER_ERROR);
    const message = error.message || status[statusCode] || 'Unexpected error';
    error = new ApiError(statusCode, message, err, true, err.stack);
  }
  next(error);
};

export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction): void => {
  let { statusCode, errorCode, message } = err;

  if (config.env === 'production' && !err.isOperational) {
    errorCode = defaultStatus.INTERNAL_SERVER_ERROR;
    message = status[defaultStatus.INTERNAL_SERVER_ERROR] || 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: errorCode,
    message,
    data: {},
    success: false,
    ...(config.env === 'development' && { err: err.stack }),
  };

  if (config.env === 'development') {
    console.error(err);
  }

  res.status(statusCode).send(response);
};
