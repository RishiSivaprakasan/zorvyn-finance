import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { authController } from './authController';
import { loginSchema, registerSchema } from './authValidation';

export const authRoutes = Router();

authRoutes.post('/register', validate({ body: registerSchema }), authController.register);
authRoutes.post('/login', validate({ body: loginSchema }), authController.login);
authRoutes.get('/me', requireAuth, authController.me);
