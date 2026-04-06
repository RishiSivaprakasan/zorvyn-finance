import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import { routes } from './routes';

export const createApp = () => {
  const app = express();

  app.set('etag', false);

  app.use(helmet());
  const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, '');
  const configuredOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map(normalizeOrigin).filter(Boolean)
    : null;

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!configuredOrigins || configuredOrigins.length === 0) return cb(null, true);
        if (!origin) return cb(null, true);

        const normalized = normalizeOrigin(origin);
        return cb(null, configuredOrigins.includes(normalized));
      },
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
