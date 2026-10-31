import { UserPayload } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      id?: string;
      rawBody?: string;
    }
  }
}

export {};
