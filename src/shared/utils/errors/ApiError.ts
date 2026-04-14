export default class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errorCode: number;
  data: unknown;

  constructor(statusCode: number, message: string, data: unknown = {}, isOperational = true, stack = '', errorCode = 2001) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.data = data;

    if (stack) this.stack = stack;
    else Error.captureStackTrace(this, this.constructor);
  }
}
