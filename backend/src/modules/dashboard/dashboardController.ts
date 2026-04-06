import type { NextFunction, Request, Response } from 'express';
import { dashboardService } from './dashboardService';

export const dashboardController = {
  summary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dashboardService.summary();
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  categoryTotals: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as any;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await dashboardService.categoryTotals({ type, page, limit });
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  recent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await dashboardService.recentActivity({ page, limit });
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  trends: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 12;

      const result = await dashboardService.monthlyTrends({ months, page, limit });
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
};
