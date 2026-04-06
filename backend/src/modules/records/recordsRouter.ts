import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { recordsController } from './recordsController';
import {
  createRecordSchema,
  listRecordsQuerySchema,
  recordIdParamsSchema,
  updateRecordSchema,
} from './recordsValidation';

export const recordRoutes = Router();

recordRoutes.use(requireAuth);

recordRoutes.get('/', requireRole(['ANALYST', 'ADMIN']), validate({ query: listRecordsQuerySchema }), recordsController.list);
recordRoutes.get('/:id', requireRole(['ANALYST', 'ADMIN']), validate({ params: recordIdParamsSchema }), recordsController.getById);

recordRoutes.post('/', requireRole(['ADMIN']), validate({ body: createRecordSchema }), recordsController.create);
recordRoutes.patch(
  '/:id',
  requireRole(['ADMIN']),
  validate({ params: recordIdParamsSchema, body: updateRecordSchema }),
  recordsController.update,
);
recordRoutes.delete('/:id', requireRole(['ADMIN']), validate({ params: recordIdParamsSchema }), recordsController.remove);
