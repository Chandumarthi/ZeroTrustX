import axios from 'axios';
import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../config/logger';

export interface EmailProvider {
  sendOTP(to: string, name: string, otp: string, expiresInMinutes: number): Promise<void>;
}

/**
 * Generate standard responsive HTML email template for OTP challenge
 */
export function generateOTPEmailTemplate(name: string, otp: string, expiresInMinutes: number): { subject: string; html: string; text: string } {
  const subject = `ZeroTrustX: Your Verification Code is ${otp}`;
  const text = `Hello ${name || 'User'},\n\nYour ZeroTrustX security verification code is: ${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\nIf you did not request this code, your account may be under reconnaissance. Please contact your security team immediately.\n\nZeroTrustX Security - Never Trust, Always Verify.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #0b0f19;
      padding: 40px 0;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 36px 32px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      text-align: center;
      margin-bottom: 28px;
    }
    .logo-badge {
      display: inline-block;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: #ffffff;
      border-radius: 9999px;
      margin-bottom: 12px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
    }
    .content {
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .otp-box {
      text-align: center;
      background-color: #1e293b;
      border: 2px dashed #3b82f6;
      border-radius: 8px;
      padding: 24px 16px;
      margin: 24px 0;
    }
    .otp-code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #60a5fa;
      margin: 0;
    }
    .expiry {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 10px;
    }
    .security-notice {
      background-color: rgba(239, 68, 68, 0.1);
      border-left: 4px solid #ef4444;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 13px;
      color: #fca5a5;
      margin-top: 24px;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #1f2937;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo-badge">ZeroTrustX</span>
        <h1 class="title">Adaptive Step-Up Verification</h1>
      </div>
      <div class="content">
        <p>Hello <strong>${name || 'User'}</strong>,</p>
        <p>A step-up verification challenge was triggered by our Zero-Trust Risk Engine during an access attempt to your account.</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="expiry">Expires in ${expiresInMinutes} minutes</div>
        </div>
        <p>Please enter this single-use code in your browser prompt to proceed.</p>
        <div class="security-notice">
          <strong>Security Notice:</strong> If you did not initiate this authentication request, someone may be attempting to access your account. Please notify your administrator immediately.
        </div>
      </div>
      <div class="footer">
        ZeroTrustX Access Control Platform &bull; Never Trust, Always Verify
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

/**
 * Development provider: logs OTP clearly to the terminal
 */
export class DevelopmentEmailProvider implements EmailProvider {
  async sendOTP(to: string, name: string, otp: string, expiresInMinutes: number): Promise<void> {
    const banner = '='.repeat(60);
    logger.info(`\n${banner}\n[DEV EMAIL ADAPTER] TO: ${to} (${name})\n[DEV EMAIL ADAPTER] OTP CODE: [ ${otp} ]\n[DEV EMAIL ADAPTER] EXPIRES IN: ${expiresInMinutes} MINUTES\n${banner}`);
  }
}

/**
 * Brevo (Sendinblue) transactional email provider via HTTP API
 */
export class BrevoEmailProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is required for BrevoEmailProvider');
    }
    this.apiKey = apiKey;
  }

  async sendOTP(to: string, name: string, otp: string, expiresInMinutes: number): Promise<void> {
    const { subject, html, text } = generateOTPEmailTemplate(name, otp, expiresInMinutes);

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            name: config.EMAIL_FROM_NAME,
            email: config.EMAIL_FROM_ADDRESS,
          },
          to: [
            {
              email: to,
              name: name || to,
            },
          ],
          subject,
          htmlContent: html,
          textContent: text,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        }
      );

      logger.info(`Brevo email dispatched successfully to ${to}`, {
        messageId: response.data?.messageId,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      logger.error(`Brevo email delivery failure to ${to}: ${errorMsg}`, {
        status: error.response?.status,
        data: error.response?.data,
      });

      // Fail-safe: Always log OTP to server output so testing and verification are never blocked
      const banner = '='.repeat(60);
      logger.info(`\n${banner}\n[BREVO FALLBACK LOG] TO: ${to} (${name})\n[BREVO FALLBACK LOG] OTP CODE: [ ${otp} ]\n[BREVO FALLBACK LOG] EXPIRES IN: ${expiresInMinutes} MINUTES\n${banner}`);

      if (config.NODE_ENV !== 'production') {
        return;
      }
      throw new Error(`Failed to deliver OTP via Brevo: ${errorMsg}`);
    }
  }
}

/**
 * SMTP Provider using nodemailer
 */
export class SMTPEmailProvider implements EmailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth:
        config.SMTP_USER && config.SMTP_PASS
          ? {
              user: config.SMTP_USER,
              pass: config.SMTP_PASS,
            }
          : undefined,
    });
  }

  async sendOTP(to: string, name: string, otp: string, expiresInMinutes: number): Promise<void> {
    const { subject, html, text } = generateOTPEmailTemplate(name, otp, expiresInMinutes);

    try {
      const info = await this.transporter.sendMail({
        from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_ADDRESS}>`,
        to,
        subject,
        text,
        html,
      });

      logger.info(`SMTP email dispatched successfully to ${to}`, {
        messageId: info.messageId,
      });
    } catch (error: any) {
      logger.error(`SMTP email delivery failure to ${to}: ${error.message}`, { error });
      throw new Error(`Failed to deliver OTP via SMTP: ${error.message}`);
    }
  }
}

/**
 * Factory function to select provider based on configuration
 */
export function getEmailProvider(): EmailProvider {
  switch (config.EMAIL_ADAPTER) {
    case 'brevo':
      if (!config.BREVO_API_KEY) {
        if (config.NODE_ENV === 'production') {
          throw new Error('BREVO_API_KEY must be configured in production when EMAIL_ADAPTER is brevo');
        }
        logger.warn('BREVO_API_KEY is not set. Falling back to DevelopmentEmailProvider');
        return new DevelopmentEmailProvider();
      }
      return new BrevoEmailProvider(config.BREVO_API_KEY);

    case 'smtp':
      return new SMTPEmailProvider();

    case 'development':
    default:
      return new DevelopmentEmailProvider();
  }
}

export const emailService = getEmailProvider();
