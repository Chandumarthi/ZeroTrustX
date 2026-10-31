export interface EmailProvider {
    sendOTP(to: string, name: string, otp: string, expiresInMinutes: number): Promise<void>;
}
/**
 * Generate standard responsive HTML email template for OTP challenge
 */
export declare function generateOTPEmailTemplate(name: string, otp: string, expiresInMinutes: number): {
    subject: string;
    html: string;
    text: string;
};
/**
 * Development provider: logs OTP clearly to the terminal
 */
export declare class DevelopmentEmailProvider implements EmailProvider {
    sendOTP(to: string, name: string, otp: string, expiresInMinutes: number): Promise<void>;
}
/**
 * Brevo (Sendinblue) transactional email provider via HTTP API
 */
export declare class BrevoEmailProvider implements EmailProvider {
    private apiKey;
    constructor(apiKey: string);
    sendOTP(to: string, name: string, otp: string, expiresInMinutes: number): Promise<void>;
}
/**
 * SMTP Provider using nodemailer
 */
export declare class SMTPEmailProvider implements EmailProvider {
    private transporter;
    constructor();
    sendOTP(to: string, name: string, otp: string, expiresInMinutes: number): Promise<void>;
}
/**
 * Factory function to select provider based on configuration
 */
export declare function getEmailProvider(): EmailProvider;
export declare const emailService: EmailProvider;
//# sourceMappingURL=email.service.d.ts.map