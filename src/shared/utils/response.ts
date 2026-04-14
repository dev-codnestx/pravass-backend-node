import { NextFunction, Request, Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  error?: string;
}

export const sendSuccessResponse = <T>(res: Response, data: T, code: number, message: string): Response =>
  res.status(res.statusCode || 200).json({
    success: true,
    code,
    message,
    data,
  });

export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  error?: string,
  code: number = statusCode,
): Response =>
  res.status(statusCode).json({
    success: false,
    code,
    message,
    error,
  });

export const responseMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
  res.success = function success(data: unknown, code: number, message: string): Response {
    return sendSuccessResponse(this, data, code, message);
  };

  res.error = function error(message: string, statusCode: number = 400, errorMsg?: string, code?: number): Response {
    return sendErrorResponse(this, statusCode, message, errorMsg, code);
  };

  next();
};
