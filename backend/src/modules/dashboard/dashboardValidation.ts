import { z } from 'zod';

export const categoryTotalsQuerySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const recentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

export const monthlyTrendsQuerySchema = z.object({
  months: z.coerce.number().int().positive().max(24).optional().default(6),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(24).optional().default(12),
});
