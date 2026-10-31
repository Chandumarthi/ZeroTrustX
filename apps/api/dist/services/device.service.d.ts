export declare class DeviceService {
    /**
     * Deterministically generate a SHA-256 fingerprint from userAgent and ipAddress
     */
    generateDeviceFingerprint(userAgent: string, ipAddress: string): string;
    /**
     * Record or update a device record for a given user
     */
    recordDevice(userId: string, userAgent: string, ipAddress: string): Promise<{
        id: string;
        userId: string;
        deviceFingerprint: string;
        userAgent: string;
        ipAddress: string;
        isKnown: boolean;
        firstSeenAt: Date;
        lastSeenAt: Date;
        loginCount: number;
    }>;
    /**
     * Check whether a device fingerprint is known and trusted for this user
     */
    isDeviceKnown(userId: string, fingerprint: string): Promise<boolean>;
    /**
     * Fetch all registered devices for a user
     */
    getDevicesForUser(userId: string): Promise<{
        id: string;
        userId: string;
        deviceFingerprint: string;
        userAgent: string;
        ipAddress: string;
        isKnown: boolean;
        firstSeenAt: Date;
        lastSeenAt: Date;
        loginCount: number;
    }[]>;
}
export declare const deviceService: DeviceService;
//# sourceMappingURL=device.service.d.ts.map