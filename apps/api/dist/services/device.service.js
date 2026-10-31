"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceService = exports.DeviceService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
class DeviceService {
    /**
     * Deterministically generate a SHA-256 fingerprint from userAgent and ipAddress
     */
    generateDeviceFingerprint(userAgent, ipAddress) {
        const normalizedAgent = (userAgent || 'unknown').trim().toLowerCase();
        const normalizedIp = (ipAddress || 'unknown').trim();
        return crypto_1.default
            .createHash('sha256')
            .update(`${normalizedAgent}::${normalizedIp}`)
            .digest('hex');
    }
    /**
     * Record or update a device record for a given user
     */
    async recordDevice(userId, userAgent, ipAddress) {
        const fingerprint = this.generateDeviceFingerprint(userAgent, ipAddress);
        try {
            const existing = await database_1.prisma.device.findUnique({
                where: {
                    userId_deviceFingerprint: {
                        userId,
                        deviceFingerprint: fingerprint,
                    },
                },
            });
            if (existing) {
                return await database_1.prisma.device.update({
                    where: { id: existing.id },
                    data: {
                        lastSeenAt: new Date(),
                        loginCount: { increment: 1 },
                        ipAddress,
                        userAgent,
                        isKnown: true,
                    },
                });
            }
            return await database_1.prisma.device.create({
                data: {
                    userId,
                    deviceFingerprint: fingerprint,
                    userAgent,
                    ipAddress,
                    isKnown: true,
                    firstSeenAt: new Date(),
                    lastSeenAt: new Date(),
                    loginCount: 1,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to record device', { userId, fingerprint, error });
            throw error;
        }
    }
    /**
     * Check whether a device fingerprint is known and trusted for this user
     */
    async isDeviceKnown(userId, fingerprint) {
        try {
            const device = await database_1.prisma.device.findUnique({
                where: {
                    userId_deviceFingerprint: {
                        userId,
                        deviceFingerprint: fingerprint,
                    },
                },
            });
            return !!device && device.isKnown;
        }
        catch (error) {
            logger_1.logger.error('Error checking isDeviceKnown', { userId, fingerprint, error });
            return false;
        }
    }
    /**
     * Fetch all registered devices for a user
     */
    async getDevicesForUser(userId) {
        return database_1.prisma.device.findMany({
            where: { userId },
            orderBy: { lastSeenAt: 'desc' },
        });
    }
}
exports.DeviceService = DeviceService;
exports.deviceService = new DeviceService();
//# sourceMappingURL=device.service.js.map