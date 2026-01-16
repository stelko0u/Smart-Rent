import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.SITE_URL ??
  'http://localhost:3000';

type Provider = 'abv';

interface MailPayload {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

function createTransporter(provider: Provider) {
  return nodemailer.createTransport({
    host: 'smtp.abv.bg',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ABV_USER,
      pass: process.env.ABV_PASS,
    },
  });
}

export async function sendMail(
  payload: MailPayload,
  provider: Provider = 'abv',
) {
  const transporter = createTransporter(provider);

  const defaultFrom =
    payload.from ?? process.env.EMAIL_FROM ?? process.env.ABV_USER;

  const email: string = Array.isArray(payload.to) ? payload.to[0] : payload.to;
  const message: string =
    payload.text ??
    (typeof payload.html === 'string'
      ? payload.html.replace(/<[^>]*>/g, '')
      : '');

  if (!email) {
    throw new Error('Missing recipient email');
  }

  const info = await transporter.sendMail({
    from: defaultFrom,
    to: email,
    subject: payload.subject ?? 'Съобщение от сайта',
    text: message,
    html: payload.html ?? `<p>${message}</p>`,
  });

  return info;
}

export async function sendVerificationEmail(email: string, userId: number) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');

  const token = jwt.sign({ userId, type: 'verify-email' }, JWT_SECRET, {
    expiresIn: '24h',
    subject: String(userId),
  });

  const verifyUrl = `${APP_URL}/api/auth/verify?token=${encodeURIComponent(
    token,
  )}`;

  const subject = 'Verify your Smart Rent account';
  const text = `Please verify your email by visiting: ${verifyUrl}`;

  const html = `
  <p>Please verify your email by clicking <a href="${verifyUrl}">here</a>.</p>
  <p>Or copy and paste this link into your browser: ${verifyUrl}</p>
  `;

  return sendMail({ to: email, subject, text, html }, 'abv');
}
