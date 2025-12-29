import nodemailer from 'nodemailer';
import { EmailProvider, EmailPayload } from '../emails.provider';
import { logger } from '@/logger/logger';

export class NodemailerProvider implements EmailProvider {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // gmail
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN,
      },
    });
  }

  async send({ to, subject, text, html }: EmailPayload) {
    try {
      await this.transporter.sendMail({
        from: `Fugal Labs <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Email sent to ${to} using Nodemailer`);
    } catch (error: unknown) {
      logger.error(`Error sending email with Nodemailer: ${error}`);
      throw error;
    }
  }
}
