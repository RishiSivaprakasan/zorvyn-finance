import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Missing Authorization header', 401, 'UNAUTHORIZED'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    const userId = payload.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!user) return next(new AppError('Invalid token', 401, 'UNAUTHORIZED'));
    if (user.status !== 'ACTIVE') return next(new AppError('User is inactive', 403, 'FORBIDDEN'));

    req.auth = { userId: user.id, role: user.role, status: user.status };
    return next();
  } catch {
    return next(new AppError('Invalid token', 401, 'UNAUTHORIZED'));
  }
};
