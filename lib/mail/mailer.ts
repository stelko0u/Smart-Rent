import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export function getMailerTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('smtp_not_configured');
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.abv.bg',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ABV_USER,
      pass: process.env.ABV_PASS,
    },
  });

  return transporter;
}
