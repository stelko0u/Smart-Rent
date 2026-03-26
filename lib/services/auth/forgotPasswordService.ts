import crypto from 'crypto';
import { UserRepository } from '@/lib/repository/UserRepository';
import { PasswordResetTokenRepository } from '@/lib/repository/PasswordResetTokenRepository';
import { getMailerTransporter } from '@/lib/mail/mailer';
import { getResetPasswordEmailTemplate } from '@/lib/mail/templates/resetPasswordTemplate';
import { isValidEmail, normalizeEmail } from '@/lib/utils/email';

export async function sendForgotPasswordEmail(rawEmail: string) {
  const normalizedEmail = normalizeEmail(rawEmail);

  if (!isValidEmail(normalizedEmail)) {
    throw new Error('INVALID_EMAIL');
  }

  const user = await UserRepository.findByEmail(normalizedEmail);

  // Не издаваме дали има такъв акаунт
  if (!user) {
    return {
      success: true,
      message: 'Ако съществува акаунт с този имейл, ще получиш инструкции.',
    };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const id = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await PasswordResetTokenRepository.deleteByEmail(normalizedEmail);

  await PasswordResetTokenRepository.create({
    id,
    email: normalizedEmail,
    token: tokenHash,
    expiresAt,
  });

  const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${host}/reset-password?token=${rawToken}&email=${encodeURIComponent(
    normalizedEmail,
  )}`;

  const transporter = await getMailerTransporter();

  await transporter.sendMail({
    from:
      process.env.EMAIL_FROM ||
      process.env.ABV_USER ||
      `no-reply@${new URL(host).hostname}`,
    to: normalizedEmail,
    subject: 'Инструкции за нулиране на паролата',
    html: getResetPasswordEmailTemplate(resetLink),
  });

  return {
    success: true,
    message: 'Ако съществува акаунт с този имейл, ще получиш инструкции.',
  };
}
