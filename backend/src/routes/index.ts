import { Router } from 'express';
import { authRoutes } from '../modules/auth/authRouter';
import { userRoutes } from '../modules/users/usersRouter';
import { recordRoutes } from '../modules/records/recordsRouter';
import { dashboardRoutes } from '../modules/dashboard/dashboardRouter';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/records', recordRoutes);
routes.use('/dashboard', dashboardRoutes);
