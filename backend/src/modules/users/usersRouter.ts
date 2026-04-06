import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { usersController } from './usersController';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamsSchema,
} from './usersValidation';

export const userRoutes = Router();

userRoutes.use(requireAuth);
userRoutes.use(requireRole(['ADMIN']));

userRoutes.post('/', validate({ body: createUserSchema }), usersController.create);
userRoutes.get('/', validate({ query: listUsersQuerySchema }), usersController.list);
userRoutes.get('/:id', validate({ params: userIdParamsSchema }), usersController.getById);
userRoutes.patch('/:id', validate({ params: userIdParamsSchema, body: updateUserSchema }), usersController.update);
userRoutes.post('/:id/deactivate', validate({ params: userIdParamsSchema }), usersController.deactivate);
