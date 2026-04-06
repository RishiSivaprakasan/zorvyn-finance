import type { NextFunction, Request, Response } from 'express';
import { recordsService } from './recordsService';

export const recordsController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await recordsService.create({ userId: req.auth!.userId }, req.body);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await recordsService.list(req.query as any);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await recordsService.getById(req.params.id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await recordsService.update(req.params.id, req.body);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await recordsService.remove(req.params.id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
};
