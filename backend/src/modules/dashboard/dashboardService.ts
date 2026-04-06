import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

const toNumber = (d: Prisma.Decimal | null | undefined) => (d ? Number(d) : 0);

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

type SummaryResult = {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
};

type CategoryTotalsResult = {
  items: Array<{ category: string; total: number }>;
  page: number;
  limit: number;
  total: number;
};

type RecentActivityResult = {
  items: Array<{
    id: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    date: Date;
    notes: string | null;
    createdAt: Date;
  }>;
  page: number;
  limit: number;
  total: number;
};

type MonthlyTrendsResult = {
  items: Array<{ month: string; income: number; expense: number; net: number }>;
  page: number;
  limit: number;
  total: number;
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

const getCached = <T,>(key: string): T | undefined => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
};

const setCached = (key: string, value: unknown, ttlMs: number) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const stableKey = (prefix: string, obj: Record<string, unknown>) => {
  const keys = Object.keys(obj).sort();
  return `${prefix}:${keys.map((k) => `${k}=${String(obj[k])}`).join('&')}`;
};

type CategoryGroupRow = {
  category: string;
  _sum: {
    amount: Prisma.Decimal | null;
  };
};

type RecentActivityRow = {
  id: string;
  amount: Prisma.Decimal;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
};

export const dashboardService = {
  summary: async (): Promise<SummaryResult> => {
    const cacheKey = 'dashboard:summary';
    const cached: SummaryResult | undefined = getCached<SummaryResult>(cacheKey);
    if (cached) return cached;

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { deletedAt: null, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.financialRecord.aggregate({
        where: { deletedAt: null, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = toNumber(incomeAgg._sum.amount);
    const totalExpenses = toNumber(expenseAgg._sum.amount);

    const result = {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
    };

    setCached(cacheKey, result, 3000);
    return result;
  },

  categoryTotals: async (input?: {
    type?: 'INCOME' | 'EXPENSE';
    page?: number;
    limit?: number;
  }): Promise<CategoryTotalsResult> => {
    const page = clamp(input?.page ?? 1, 1, 1000000);
    const limit = clamp(input?.limit ?? 20, 1, 100);
    const type = input?.type;

    const cacheKey = stableKey('dashboard:categoryTotals', { type: type ?? '', page, limit });
    const cached: CategoryTotalsResult | undefined = getCached<CategoryTotalsResult>(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null, ...(type ? { type } : {}) };

    const distinctTotalPromise = prisma.financialRecord.findMany({
      where,
      select: { category: true },
      distinct: ['category'],
    });

    const [rows, totalGroups] = await Promise.all([
      prisma.financialRecord.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        skip,
        take: limit,
      }) as unknown as Promise<CategoryGroupRow[]>,
      distinctTotalPromise.then((all) => all.length),
    ]);

    const result = {
      items: rows.map((r) => ({
        category: r.category,
        total: toNumber(r._sum.amount),
      })),
      page,
      limit,
      total: totalGroups,
    };

    setCached(cacheKey, result, 3000);
    return result;
  },

  recentActivity: async (input?: { page?: number; limit?: number }): Promise<RecentActivityResult> => {
    const page = clamp(input?.page ?? 1, 1, 1000000);
    const limit = clamp(input?.limit ?? 10, 1, 50);
    const skip = (page - 1) * limit;

    const cacheKey = stableKey('dashboard:recent', { page, limit });
    const cached: RecentActivityResult | undefined = getCached<RecentActivityResult>(cacheKey);
    if (cached) return cached;

    const where = { deletedAt: null };

    const [items, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          date: true,
          notes: true,
          createdAt: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }) as unknown as Promise<RecentActivityRow[]>,
      prisma.financialRecord.count({ where }),
    ]);

    const result = {
      items: items.map((i) => ({
        ...i,
        amount: toNumber(i.amount),
      })),
      page,
      limit,
      total,
    };

    setCached(cacheKey, result, 1500);
    return result;
  },

  monthlyTrends: async (input?: { months?: number; page?: number; limit?: number }): Promise<MonthlyTrendsResult> => {
    const months = clamp(input?.months ?? 6, 1, 24);
    const page = clamp(input?.page ?? 1, 1, 1000000);
    const limit = clamp(input?.limit ?? 12, 1, 24);

    const cacheKey = stableKey('dashboard:monthlyTrends', { months, page, limit });
    const cached: MonthlyTrendsResult | undefined = getCached<MonthlyTrendsResult>(cacheKey);
    if (cached) return cached;

    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const items = await prisma.financialRecord.findMany({
      where: { deletedAt: null, date: { gte: since } },
      select: { amount: true, type: true, date: true },
    });

    const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const buckets = new Map<string, { month: string; income: number; expense: number }>();

    for (const it of items) {
      const key = keyOf(it.date);
      const b = buckets.get(key) ?? { month: key, income: 0, expense: 0 };
      const amt = toNumber(it.amount);
      if (it.type === 'INCOME') b.income += amt;
      else b.expense += amt;
      buckets.set(key, b);
    }

    const all = Array.from(buckets.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((r) => ({ ...r, net: r.income - r.expense }));

    const total = all.length;
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);

    const result = {
      items: paged,
      page,
      limit,
      total,
    };

    setCached(cacheKey, result, 3000);
    return result;
  },
};
