import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.prismaGlobal ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

// Log queries in debug mode if needed
// @ts-ignore
prisma.$on('query', (e: any) => {
  logger.debug(`Prisma Query: ${e.query} - Duration: ${e.duration}ms`);
});

// @ts-ignore
prisma.$on('error', (e: any) => {
  logger.error(`Prisma Error: ${e.message}`);
});

// @ts-ignore
prisma.$on('warn', (e: any) => {
  logger.warn(`Prisma Warning: ${e.message}`);
});

/**
 * Verify database connectivity
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to the database', { error });
    throw error;
  }
}

/**
 * Disconnect from the database cleanly
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed cleanly');
  } catch (error) {
    logger.error('Error during database disconnection', { error });
  }
}
