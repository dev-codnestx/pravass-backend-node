import httpStatus from 'http-status';

// Safe fallback for CommonJS and ESM compatibility
const defaultStatus = 'default' in httpStatus ? (httpStatus as any).default : httpStatus;
const status = 'status' in httpStatus ? (httpStatus as any).status : {};

export { defaultStatus, status };
