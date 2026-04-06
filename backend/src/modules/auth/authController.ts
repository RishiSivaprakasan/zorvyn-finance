import type { Request, Response, NextFunction } from 'express';
import { authService } from './authService';

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.me(req.auth!.userId);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
};
