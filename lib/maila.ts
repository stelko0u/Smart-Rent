import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import Mail from 'nodemailer/lib/mailer';
import { getMailerTransporter } from './mail/mailer';

const JWT_SECRET = process.env.JWT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SITE_URL;
// ??
// 'http://localhost:3000';

type Provider = 'abv';

interface MailPayload {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: Mail.Attachment[];
}

// export function createTransporter(provider: Provider) {
//   return nodemailer.createTransport({
//     host: 'smtp.abv.bg',
//     port: 465,
//     secure: true,
//     auth: {
//       user: process.env.ABV_USER,
//       pass: process.env.ABV_PASS,
//     },
//   });
// }

export async function sendMail(
  payload: MailPayload,
  provider: Provider = 'abv',
) {
  const transporter = getMailerTransporter();

  const defaultFrom =
    'Smart Rent <' + (process.env.EMAIL_FROM ?? process.env.ABV_USER) + '>';
  // payload.from ?? process.env.EMAIL_FROM ?? process.env.ABV_USER;

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

  const message =
    payload.text ??
    (typeof payload.html === 'string'
      ? payload.html.replace(/<[^>]*>/g, '')
      : '');

  if (!recipients.length || !recipients[0]) {
    throw new Error('Missing recipient email');
  }

  const info = await transporter.sendMail({
    from: defaultFrom,
    to: recipients.join(', '),
    subject: payload.subject,
    text: message,
    html: payload.html ?? `<p>${message}</p>`,
    attachments: payload.attachments,
  });

  return info;
}

export async function sendVerificationEmail(email: string, userId: number) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  if (!APP_URL) throw new Error('APP_URL not configured');

  const token = jwt.sign({ userId, type: 'verify-email' }, JWT_SECRET, {
    expiresIn: '24h',
    subject: String(userId),
  });

  const verifyUrl = `${APP_URL}/api/auth/verify?token=${encodeURIComponent(
    token,
  )}`;

  const subject = 'Verify your Smart Rent account';
  const text = `Verify your Smart Rent account: ${verifyUrl}`;

  const logoPath = path.join(process.cwd(), 'public', 'logo.png');

  if (!fs.existsSync(logoPath)) {
    throw new Error(`Logo file not found at: ${logoPath}`);
  }

  const logoBuffer = fs.readFileSync(logoPath);
  const logoUrl = `${APP_URL}/logo.png`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
          
          <tr>
            <td align="center" style="background:#a9a9a9;padding:28px;color:#ffffff;">
                <img
                  src="${logoUrl}"
                  alt="Smart Rent"
                  width="180"
                  style="display:block;border:0;outline:none;text-decoration:none;height:auto;"
                />
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px;color:#111827;font-size:16px;line-height:1.6;">
              <h2 style="margin:0 0 16px 0;font-size:24px;color:#111827;">
                Verify your email address
              </h2>

              <p style="margin:0 0 16px 0;">
                Welcome to <strong>Smart Rent</strong>! Please confirm your email address to activate your account.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0;">
                <tr>
                  <td align="center">
                    <a
                      href="${verifyUrl}"
                      style="background:#4f46e5;color:#ffffff;padding:14px 26px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:15px;"
                    >
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>

              <p style="margin:0 0 16px 0;word-break:break-all;font-size:14px;">
                <a href="${verifyUrl}" style="color:#4f46e5;">${verifyUrl}</a>
              </p>

              <p style="margin:24px 0 0 0;font-size:14px;color:#6b7280;">
                This verification link will expire in <strong>24 hours</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;padding:20px;text-align:center;font-size:13px;color:#9ca3af;">
              © ${new Date().getFullYear()} Smart Rent<br />
              Secure property rental platform
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  return sendMail(
    {
      to: email,
      subject,
      text,
      html,
      attachments: [
        {
          filename: 'logo.png',
          content: logoBuffer,
          cid: 'smart-rent-logo',
          contentType: 'image/png',
          contentDisposition: 'inline',
        },
      ],
    },
    'abv',
  );
}

export async function sendReservationConfirmation(
  reservation: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
  },
  car: {
    make: string;
    model: string;
    year: number;
    pricePerDay: number;
  },
) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  if (!APP_URL) throw new Error('APP_URL not configured');

  // Create confirmation token
  const token = jwt.sign(
    { reservationId: reservation.id, type: 'confirm-reservation' },
    JWT_SECRET,
    {
      expiresIn: '7d',
      subject: String(reservation.id),
    },
  );

  const confirmUrl = `${APP_URL}/api/reservations/confirm?token=${encodeURIComponent(token)}`;

  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  let logoBuffer = null;

  if (fs.existsSync(logoPath)) {
    logoBuffer = fs.readFileSync(logoPath);
  }

  const logoUrl = `${APP_URL}/logo.png`;

  const startDate = new Date(reservation.startDate).toLocaleDateString(
    'bg-BG',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );

  const endDate = new Date(reservation.endDate).toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const diffTime =
    new Date(reservation.endDate).getTime() -
    new Date(reservation.startDate).getTime();
  const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const totalPrice = Number(reservation.totalPrice) || 0;
  const formattedPrice = totalPrice.toFixed(2);

  const subject = `Confirm Your Reservation #${reservation.id} - Smart Rent`;
  const text = `Hello ${reservation.firstName} ${reservation.lastName},\n\nYour payment has been processed successfully! Please confirm your reservation:\n\n${confirmUrl}\n\nCar: ${car.make} ${car.model} (${car.year})\nFrom: ${startDate}\nTo: ${endDate}\nDays: ${days}\nTotal Price: €${formattedPrice}\n\nReservation #${reservation.id}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm Your Reservation</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
          
          <tr>
            <td align="center" style="background:#8fea35;padding:28px;color:#ffffff;">
                <img
                  src="${logoUrl}"
                  alt="Smart Rent"
                  width="180"
                  style="display:block;border:0;outline:none;text-decoration:none;height:auto;"
                />
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px;color:#111827;font-size:16px;line-height:1.6;">
              <h2 style="margin:0 0 8px 0;font-size:24px;color:#111827;">
                Payment successful! ✓
              </h2>
              
              <p style="margin:0 0 24px 0;color:#6b7280;font-size:14px;">
                Reservation #${reservation.id}
              </p>

              <p style="margin:0 0 16px 0;">
                Hello, <strong>${reservation.firstName} ${reservation.lastName}</strong>,
              </p>

              <p style="margin:0 0 24px 0;">
                Your payment has been processed successfully! To complete the process, please <strong>confirm your reservation</strong> using the button below.
              </p>

              <div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:16px;margin:24px 0;border-radius:4px;">
                <p style="margin:0;color:#856404;font-size:14px;">
                  ⚠️ <strong>Important:</strong> Your reservation will be activated after confirmation.
                </p>
              </div>

              <div style="background:#f9fafb;border-left:4px solid #10b981;padding:20px;margin:24px 0;border-radius:4px;">
                <h3 style="margin:0 0 16px 0;font-size:18px;color:#111827;">
                  Reservation Details
                </h3>
                
                <table width="100%" cellpadding="8" cellspacing="0" border="0">
                  <tr>
                    <td style="color:#6b7280;font-size:14px;padding:8px 0;">Car:</td>
                    <td style="color:#111827;font-weight:bold;font-size:14px;padding:8px 0;text-align:right;">
                      ${car.make} ${car.model} (${car.year})
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:14px;padding:8px 0;">Start Date:</td>
                    <td style="color:#111827;font-weight:600;font-size:14px;padding:8px 0;text-align:right;">
                      ${startDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:14px;padding:8px 0;">End Date:</td>
                    <td style="color:#111827;font-weight:600;font-size:14px;padding:8px 0;text-align:right;">
                      ${endDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:14px;padding:8px 0;">Days:</td>
                    <td style="color:#111827;font-weight:600;font-size:14px;padding:8px 0;text-align:right;">
                      ${days}
                    </td>
                  </tr>
                  <tr style="border-top:2px solid #e5e7eb;">
                    <td style="color:#111827;font-size:16px;font-weight:bold;padding:16px 0 8px 0;">Total Price:</td>
                    <td style="color:#10b981;font-size:20px;font-weight:bold;padding:16px 0 8px 0;text-align:right;">
                      €${formattedPrice}
                    </td>
                  </tr>
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0;">
                <tr>
                  <td align="center">
                    <a
                      href="${confirmUrl}"
                      style="background:#f59e0b;color:#ffffff;padding:14px 26px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:15px;"
                    >
                      Confirm Reservation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 8px 0;font-size:14px;color:#6b7280;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>

              <p style="margin:0 0 16px 0;word-break:break-all;font-size:13px;">
                <a href="${confirmUrl}" style="color:#f59e0b;">${confirmUrl}</a>
              </p>

              <p style="margin:24px 0 0 0;font-size:14px;color:#6b7280;">
                This link will expire after <strong>7 days</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;padding:20px;text-align:center;font-size:13px;color:#9ca3af;">
              © ${new Date().getFullYear()} Smart Rent<br />
              Thank you for choosing us!
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  const mailPayload: MailPayload = {
    to: reservation.email,
    subject,
    text,
    html,
  };

  if (logoBuffer) {
    mailPayload.attachments = [
      {
        filename: 'logo.png',
        content: logoBuffer,
        cid: 'smart-rent-logo',
        contentType: 'image/png',
        contentDisposition: 'inline',
      },
    ];
  }

  return sendMail(mailPayload, 'abv');
}
