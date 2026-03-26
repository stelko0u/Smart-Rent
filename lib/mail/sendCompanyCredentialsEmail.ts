import { createTransporter } from '@/lib/maila';
import { getMailerTransporter } from './mailer';

type SendCompanyCredentialsEmailInput = {
  companyName: string;
  loginEmail: string;
  temporaryPassword: string;
  to: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function sendCompanyCredentialsEmail(
  input: SendCompanyCredentialsEmailInput,
) {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!from) throw new Error('smtp_from_not_configured');

  const devOverride = process.env.DEV_ONBOARDING_EMAIL_OVERRIDE?.trim();
  const to =
    process.env.NODE_ENV !== 'production' && devOverride
      ? devOverride
      : input.to;

  const transporter = createTransporter('abv');

  const safeCompanyName = escapeHtml(input.companyName);
  const safeLoginEmail = escapeHtml(input.loginEmail);
  const safeTemporaryPassword = escapeHtml(input.temporaryPassword);

  await transporter.sendMail({
    from,
    to,
    subject: 'AutoRent: Временна парола за достъп',
    text: [
      'Здравейте,',
      '',
      `Създаден е профил за фирма "${input.companyName}".`,
      `Имейл за вход: ${input.loginEmail}`,
      `Временна парола: ${input.temporaryPassword}`,
      '',
      'При първо влизане смяната на паролата е задължителна.',
      '',
      'Поздрави,',
      'AutoRent',
    ].join('\n'),
    html: `
      <p>Здравейте,</p>
      <p>Създаден е профил за фирма "<strong>${safeCompanyName}</strong>".</p>
      <p><strong>Имейл за вход:</strong> ${safeLoginEmail}</p>
      <p><strong>Временна парола:</strong> ${safeTemporaryPassword}</p>
      <p>При първо влизане смяната на паролата е <strong>задължителна</strong>.</p>
      <p>Поздрави,<br/>AutoRent</p>
    `,
  });

  return {
    sentTo: to,
    originalRecipient: input.to,
    devOverrideUsed: to !== input.to,
  };
}
