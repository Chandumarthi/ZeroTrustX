import { PrismaClient } from '@prisma/client';
declare global {
    var prismaGlobal: PrismaClient | undefined;
}
export declare const prisma: PrismaClient;
/**
 * Verify database connectivity
 */
export declare function connectDatabase(): Promise<void>;
/**
 * Disconnect from the database cleanly
 */
export declare function disconnectDatabase(): Promise<void>;
//# sourceMappingURL=database.d.ts.map