import { IUserDoc } from './modules/user/user.interfaces';

declare global {
  namespace Express {
    interface Response {
      success: (data: unknown, code: number, message: string) => Response;
      error: (message: string, statusCode?: number, errorMsg?: string, code?: number) => Response;
    }
  }
}

declare module 'express-serve-static-core' {
  export interface Request {
    user: IUserDoc;
  }

  export interface Response {
    success: (data: unknown, code: number, message: string) => Response;
    error: (message: string, statusCode?: number, errorMsg?: string, code?: number) => Response;
  }
}

declare module 'express' {
  export interface Response {
    success: (data: unknown, code: number, message: string) => Response;
    error: (message: string, statusCode?: number, errorMsg?: string, code?: number) => Response;
  }
}
