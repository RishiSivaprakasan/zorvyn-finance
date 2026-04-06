import type { NextFunction, Request, Response } from 'express';
import { usersService } from './usersService';

export const usersController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await usersService.create(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await usersService.list(req.query as any);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await usersService.getById(req.params.id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await usersService.update(req.params.id, req.body);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  deactivate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await usersService.deactivate(req.params.id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
};
