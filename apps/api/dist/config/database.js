"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
exports.prisma = global.prismaGlobal ||
    new client_1.PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
        ],
    });
if (process.env.NODE_ENV !== 'production') {
    global.prismaGlobal = exports.prisma;
}
// Log queries in debug mode if needed
// @ts-ignore
exports.prisma.$on('query', (e) => {
    logger_1.logger.debug(`Prisma Query: ${e.query} - Duration: ${e.duration}ms`);
});
// @ts-ignore
exports.prisma.$on('error', (e) => {
    logger_1.logger.error(`Prisma Error: ${e.message}`);
});
// @ts-ignore
exports.prisma.$on('warn', (e) => {
    logger_1.logger.warn(`Prisma Warning: ${e.message}`);
});
/**
 * Verify database connectivity
 */
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info('Database connection established successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to the database', { error });
        throw error;
    }
}
/**
 * Disconnect from the database cleanly
 */
async function disconnectDatabase() {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info('Database connection closed cleanly');
    }
    catch (error) {
        logger_1.logger.error('Error during database disconnection', { error });
    }
}
//# sourceMappingURL=database.js.map