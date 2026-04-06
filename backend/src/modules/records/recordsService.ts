import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/errors';

const recordSelect = {
  id: true,
  userId: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const recordsService = {
  create: async (actor: { userId: string }, input: any) => {
    const record = await prisma.financialRecord.create({
      data: {
        userId: actor.userId,
        amount: new Prisma.Decimal(input.amount),
        type: input.type,
        category: input.category,
        date: input.date,
        notes: input.notes,
      },
      select: recordSelect,
    });

    return { record };
  },

  list: async (query: { page: number; limit: number; type?: any; category?: any; fromDate?: Date; toDate?: Date }) => {
    const skip = (query.page - 1) * query.limit;

    const where: any = {
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.fromDate || query.toDate
        ? {
            date: {
              ...(query.fromDate ? { gte: query.fromDate } : {}),
              ...(query.toDate ? { lte: query.toDate } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        select: recordSelect,
        orderBy: { date: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
    };
  },

  getById: async (id: string) => {
    const record = await prisma.financialRecord.findFirst({
      where: { id, deletedAt: null },
      select: recordSelect,
    });
    if (!record) throw new AppError('Record not found', 404, 'NOT_FOUND');
    return { record };
  },

  update: async (id: string, input: any) => {
    const existing = await prisma.financialRecord.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError('Record not found', 404, 'NOT_FOUND');

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        ...(input.amount !== undefined ? { amount: new Prisma.Decimal(input.amount) } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.date !== undefined ? { date: input.date } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      select: recordSelect,
    });

    return { record };
  },

  remove: async (id: string) => {
    const existing = await prisma.financialRecord.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError('Record not found', 404, 'NOT_FOUND');

    await prisma.financialRecord.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  },
};
