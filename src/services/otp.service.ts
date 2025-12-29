import { redis } from '@/lib/redis';
import { randomInt } from 'crypto';
import { ApiError } from '@/utils/api-errors';
import { emailService } from '@/emails/emails.service';
import { otpTemplate } from '@/emails/otpTemplate';

const OTP_EXPIRATION_TIME = 5 * 60; // 5 minutes in seconds
const OTP_COOLDOWN_TIME = 60; // 1 minute in seconds
const OTP_RESEND_WINDOW = 15 * 60; // 15 minutes in seconds
const MAX_OTP_ATTEMPTS = 5;

function otpKey(email: string): string {
  return `otp:email:${email}`;
}

function resendCooldownKey(email: string): string {
  return `otp:resend:cooldown:email:${email}`;
}

function resendCountKey(email: string): string {
  return `otp:resend:count:email:${email}`;
}

function verifyAttemptsKey(email: string): string {
  return `otp:verify:attempts:email:${email}`;
}

// Helper function to generate and store OTP
async function generateOtp(email: string): Promise<string> {
  const cooldownKey = resendCooldownKey(email);
  const countKey = resendCountKey(email);
  const otpRedisKey = otpKey(email);

  if (await redis.exists(cooldownKey)) {
    throw new ApiError(429, 'OTP resend is on cooldown. Please wait before requesting a new OTP.');
  }

  const resendCount = await redis.incr(countKey);
  if (resendCount === 1) {
    await redis.expire(countKey, OTP_RESEND_WINDOW);
  } else if (resendCount > MAX_OTP_ATTEMPTS) {
    throw new ApiError(429, 'Maximum OTP resend attempts exceeded. Please try again later.');
  }

  const otp = randomInt(100000, 999999).toString();

  await redis.set(otpRedisKey, otp, 'EX', OTP_EXPIRATION_TIME);
  await redis.set(cooldownKey, '1', 'EX', OTP_COOLDOWN_TIME);

  return otp;
}

export async function sendOtpEmail(email: string): Promise<void> {
  const otp = await generateOtp(email);
  const template = otpTemplate(otp);

  await emailService.send({
    to: email,
    subject: 'Your Fugal Labs OTP Code',
    ...template,
  });
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  const otpRedisKey = otpKey(email);
  const attemptsKey = verifyAttemptsKey(email);

  const storedOtp = await redis.get(otpRedisKey);
  if (!storedOtp) {
    throw new ApiError(400, 'OTP has expired or does not exist. Please request a new OTP.');
  }

  const attempts = await redis.incr(attemptsKey);
  if (attempts === 1) {
    await redis.expire(attemptsKey, OTP_EXPIRATION_TIME);
  } else if (attempts > MAX_OTP_ATTEMPTS) {
    throw new ApiError(
      429,
      'Maximum OTP verification attempts exceeded. Please request a new OTP.'
    );
  }

  if (storedOtp !== otp) {
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }

  await redis.del(otpRedisKey);
  await redis.del(attemptsKey);
}
