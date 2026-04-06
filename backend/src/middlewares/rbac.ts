import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import type { UserRole } from '../types/rbac';

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    if (!roles.includes(req.auth.role)) return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    return next();
  };
};
