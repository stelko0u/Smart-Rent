import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

let transporter: nodemailer.Transporter | null = null;

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isTruthy(value: string | undefined) {
  if (!value) return false;

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase().trim());
}

export type MailPayload = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: Mail.Attachment[];
};

export function getMailerTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST ?? 'smtp.abv.bg';
  const port = toNumber(
    process.env.SMTP_PORT,
    host === 'smtp.abv.bg' ? 465 : 587,
  );
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? isTruthy(process.env.SMTP_SECURE)
      : port === 465;

  if (!user || !pass) {
    throw new Error('smtp_not_configured');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export function createTransporter() {
  return getMailerTransporter();
}


