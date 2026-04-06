import { z } from 'zod';

export const createRecordSchema = z.object({
  amount: z.coerce.number().finite(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1).max(80),
  date: z.coerce.date(),
  notes: z.string().max(500).optional(),
});

export const updateRecordSchema = z.object({
  amount: z.coerce.number().finite().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().min(1).max(80).optional(),
  date: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export const recordIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listRecordsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().min(1).max(80).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});
