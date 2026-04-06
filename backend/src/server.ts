import { env } from './config/env';
import { prisma } from './config/prisma';
import { createApp } from './app';

const app = createApp();

const start = async () => {
  await prisma.$connect();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${env.PORT}`);
  });
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
