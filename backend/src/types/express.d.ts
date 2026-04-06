import type { UserRole, UserStatus } from './rbac';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: UserRole;
        status: UserStatus;
      };
    }
  }
}

export { };
