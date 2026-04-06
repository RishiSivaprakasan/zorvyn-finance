import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { dashboardController } from './dashboardController';
import { categoryTotalsQuerySchema, monthlyTrendsQuerySchema, recentQuerySchema } from './dashboardValidation';

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

dashboardRoutes.get('/summary', requireRole(['VIEWER', 'ANALYST', 'ADMIN']), dashboardController.summary);
dashboardRoutes.get(
    '/category-totals',
    requireRole(['VIEWER', 'ANALYST', 'ADMIN']),
    validate({ query: categoryTotalsQuerySchema }),
    dashboardController.categoryTotals,
);
dashboardRoutes.get('/recent', requireRole(['VIEWER', 'ANALYST', 'ADMIN']), validate({ query: recentQuerySchema }), dashboardController.recent);
dashboardRoutes.get(
    '/trends/monthly',
    requireRole(['VIEWER', 'ANALYST', 'ADMIN']),
    validate({ query: monthlyTrendsQuerySchema }),
    dashboardController.trends,
);
