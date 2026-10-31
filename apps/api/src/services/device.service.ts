import crypto from 'crypto';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

export class DeviceService {
  /**
   * Deterministically generate a SHA-256 fingerprint from userAgent and ipAddress
   */
  generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    const normalizedAgent = (userAgent || 'unknown').trim().toLowerCase();
    const normalizedIp = (ipAddress || 'unknown').trim();
    return crypto
      .createHash('sha256')
      .update(`${normalizedAgent}::${normalizedIp}`)
      .digest('hex');
  }

  /**
   * Record or update a device record for a given user
   */
  async recordDevice(userId: string, userAgent: string, ipAddress: string) {
    const fingerprint = this.generateDeviceFingerprint(userAgent, ipAddress);

    try {
      const existing = await prisma.device.findUnique({
        where: {
          userId_deviceFingerprint: {
            userId,
            deviceFingerprint: fingerprint,
          },
        },
      });

      if (existing) {
        return await prisma.device.update({
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

      return await prisma.device.create({
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
    } catch (error) {
      logger.error('Failed to record device', { userId, fingerprint, error });
      throw error;
    }
  }

  /**
   * Check whether a device fingerprint is known and trusted for this user
   */
  async isDeviceKnown(userId: string, fingerprint: string): Promise<boolean> {
    try {
      const device = await prisma.device.findUnique({
        where: {
          userId_deviceFingerprint: {
            userId,
            deviceFingerprint: fingerprint,
          },
        },
      });

      return !!device && device.isKnown;
    } catch (error) {
      logger.error('Error checking isDeviceKnown', { userId, fingerprint, error });
      return false;
    }
  }

  /**
   * Fetch all registered devices for a user
   */
  async getDevicesForUser(userId: string) {
    return prisma.device.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
  }
}

export const deviceService = new DeviceService();
