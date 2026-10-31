import winston from 'winston';
/**
 * Recursively sanitizes any sensitive information from log payloads
 */
export declare function sanitizeLogData(obj: any): any;
export declare const logger: winston.Logger;
/**
 * Create a child logger with a correlation requestId
 */
export declare function getRequestLogger(requestId: string): winston.Logger;
//# sourceMappingURL=logger.d.ts.map