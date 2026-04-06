import bcrypt from 'bcryptjs';
import type { User, UserRole } from '@prisma/client';

import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/errors';
import { signAccessToken } from '../../utils/jwt';

type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'status' | 'createdAt' | 'updatedAt'>;

const toPublicUser = (u: User): PublicUser => {
  const { id, email, name, role, status, createdAt, updatedAt } = u;
  return { id, email, name, role, status, createdAt, updatedAt };
};

export const authService = {
  register: async (input: { email: string; password: string; name?: string }) => {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError('Email already in use', 409, 'EMAIL_TAKEN');

    const usersCount = await prisma.user.count();
    const role: UserRole = usersCount === 0 ? 'ADMIN' : 'VIEWER';

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role,
        status: 'ACTIVE',
      },
    });

    const token = signAccessToken({ sub: user.id, role: user.role });

    return { user: toPublicUser(user), token };
  },

  login: async (input: { email: string; password: string }) => {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
    if (user.status !== 'ACTIVE') throw new AppError('User is inactive', 403, 'FORBIDDEN');

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');

    const token = signAccessToken({ sub: user.id, role: user.role });
    return { user: toPublicUser(user), token };
  },

  me: async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return { user: toPublicUser(user) };
  },
};
