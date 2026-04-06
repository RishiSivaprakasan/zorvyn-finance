import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';

import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/errors';

type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'status' | 'createdAt' | 'updatedAt'>;

const toPublicUser = (u: User): PublicUser => {
  const { id, email, name, role, status, createdAt, updatedAt } = u;
  return { id, email, name, role, status, createdAt, updatedAt };
};

export const usersService = {
  create: async (input: {
    email: string;
    password: string;
    name?: string;
    role?: 'VIEWER' | 'ANALYST' | 'ADMIN';
    status?: 'ACTIVE' | 'INACTIVE';
  }) => {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError('Email already in use', 409, 'EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role ?? 'VIEWER',
        status: input.status ?? 'ACTIVE',
      },
    });

    return { user: toPublicUser(user) };
  },

  list: async (query: { page: number; limit: number; role?: string; status?: string }) => {
    const skip = (query.page - 1) * query.limit;

    const where = {
      ...(query.role ? { role: query.role as any } : {}),
      ...(query.status ? { status: query.status as any } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, status: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
    };
  },

  getById: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return { user: toPublicUser(user) };
  },

  update: async (id: string, input: { name?: string; role?: any; status?: any }) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    return { user: toPublicUser(updated) };
  },

  deactivate: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const updated = await prisma.user.update({ where: { id }, data: { status: 'INACTIVE' } });
    return { user: toPublicUser(updated) };
  },
};
