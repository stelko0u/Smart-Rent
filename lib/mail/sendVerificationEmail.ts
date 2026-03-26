import jwt from 'jsonwebtoken';
import { sendMail } from '@/lib/mail/mailer';
import { getConfirmEmailTemplate } from '@/lib/mail/templates/confirmEmailTemplate';

const JWT_SECRET = process.env.JWT_SECRET;

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.SITE_URL ??
    'http://localhost:3000'
  );
}

export async function sendVerificationEmail(
  email: string,
  userId: number,
  userName?: string | null,
) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const token = jwt.sign({ userId, type: 'verify-email' }, JWT_SECRET, {
    expiresIn: '24h',
    subject: String(userId),
  });

  const appUrl = getAppUrl();
  const verifyUrl = `${appUrl}/api/auth/verify?token=${encodeURIComponent(
    token,
  )}`;

  await sendMail({
    to: email,
    subject: 'Потвърди своя имейл адрес',
    text: `Потвърди своя имейл адрес: ${verifyUrl}`,
    html: getConfirmEmailTemplate({
      verifyUrl,
      appName: 'SmartRent',
      userName,
    }),
  });
}
