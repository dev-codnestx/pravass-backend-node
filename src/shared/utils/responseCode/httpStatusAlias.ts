import httpStatus from 'http-status';

// Safe fallback for CommonJS and ESM compatibility
const defaultStatus = httpStatus;
const status: Record<string, string> = {};

export { defaultStatus, status };
