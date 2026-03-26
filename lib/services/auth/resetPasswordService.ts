import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PasswordResetTokenRepository } from '@/lib/repository/PasswordResetTokenRepository';
import { UserRepository } from '@/lib/repository/UserRepository';

type Input = {
  email: string;
  token: string;
  password: string;
};

function normalizeEmail(value: string) {
  return String(value).toLowerCase().trim();
}

export async function resetPassword({ email, token, password }: Input) {
  const normalizedEmail = normalizeEmail(email);
  const rawToken = String(token || '').trim();
  const newPassword = String(password || '');

  if (!normalizedEmail || !rawToken || !newPassword) {
    throw new Error('MISSING_FIELDS');
  }

  if (newPassword.length < 6) {
    throw new Error('WEAK_PASSWORD');
  }

  // Ако в базата пазиш HASH на токена
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const record = await PasswordResetTokenRepository.findByToken(tokenHash);

  if (!record) {
    throw new Error('INVALID_OR_USED_TOKEN');
  }

  if (record.email !== normalizedEmail) {
    throw new Error('EMAIL_TOKEN_MISMATCH');
  }

  if (new Date(record.expiresAt) < new Date()) {
    throw new Error('TOKEN_EXPIRED');
  }

  const user = await UserRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await UserRepository.update(user.id, { password: hashedPassword });

  await PasswordResetTokenRepository.deleteByToken(tokenHash);

  return {
    success: true,
    message: 'Паролата е сменена успешно.',
  };
}
