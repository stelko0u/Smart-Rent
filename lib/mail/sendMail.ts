import Mail from 'nodemailer/lib/mailer';
import { getMailerTransporter } from './mailer';

export interface SendMailPayload {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: Mail.Attachment[];
}

export async function sendMail(payload: SendMailPayload) {
  const transporter = getMailerTransporter();

  const fallbackFrom =
    process.env.EMAIL_FROM ??
    process.env.SMTP_FROM ??
    process.env.SMTP_USER ??
    process.env.ABV_USER;

  if (!fallbackFrom && !payload.from) {
    throw new Error('email_from_not_configured');
  }

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

  if (!recipients.length || !recipients[0]?.trim()) {
    throw new Error('missing_recipient_email');
  }

  const plainText =
    payload.text ??
    (typeof payload.html === 'string'
      ? payload.html
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : '');

  return transporter.sendMail({
    from: payload.from ?? `Smart Rent <${fallbackFrom}>`,
    to: recipients.join(', '),
    subject: payload.subject,
    text: plainText,
    html: payload.html ?? `<p>${plainText}</p>`,
    attachments: payload.attachments,
  });
}
