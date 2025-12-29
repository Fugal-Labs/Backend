import { logger } from '@/logger/logger';
import { EmailProvider } from './emails.provider';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { ResendProvider } from './providers/resend.provider';

let provider: EmailProvider;

if (process.env.NODE_ENV === 'production') {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY missing in production');
  }
  logger.info('Using Resend as email provider in production');
  provider = new ResendProvider();
} else {
  logger.info('Using Nodemailer as email provider in non-production');
  provider = new NodemailerProvider();
}

export const emailService = provider;
