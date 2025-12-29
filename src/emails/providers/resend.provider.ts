import { Resend } from 'resend';
import { EmailProvider, EmailPayload } from '../emails.provider';
import { logger } from '@/logger/logger';

export class ResendProvider implements EmailProvider {
  private resend = new Resend(process.env.RESEND_API_KEY!);

  async send({ to, subject, text, html }: EmailPayload) {
    try {
      await this.resend.emails.send({
        from: `Fugal Labs <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Email sent to ${to} using Resend`);
    } catch (error: unknown) {
      logger.error(`Error sending email with Resend: ${error}`);
      throw error;
    }
  }
}
