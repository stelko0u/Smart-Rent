import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import Mail from 'nodemailer/lib/mailer';

import { sendMail } from '@/lib/maila';

const JWT_SECRET = process.env.JWT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SITE_URL;

export async function sendReservationPaymentEmail(
  reservation: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    paymentMethod?: 'CARD' | 'ON_SPOT';
  },
  car: {
    make: string;
    model: string;
    year: number;
    pricePerDay: number;
  },
) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  if (!APP_URL) {
    throw new Error('APP_URL not configured');
  }

  const token = jwt.sign(
    {
      reservationId: reservation.id,
      type: 'confirm-reservation-before-payment',
    },
    JWT_SECRET,
    {
      expiresIn: '24h',
      subject: String(reservation.id),
    },
  );

  const continueUrl = `${APP_URL}/api/reservations/confirm?token=${encodeURIComponent(
    token,
  )}`;

  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  const attachments: Mail.Attachment[] = [];

  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'logo.png',
      content: fs.readFileSync(logoPath),
      cid: 'smart-rent-logo',
      contentType: 'image/png',
      contentDisposition: 'inline',
    });
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
  const totalPrice = Number(reservation.totalPrice || 0).toFixed(2);

  const subject = `Потвърди резервацията си #${reservation.id} - Smart Rent`;

  const text = `Здравей, ${reservation.firstName} ${reservation.lastName},

Получихме твоята заявка за резервация.

Автомобил: ${car.make} ${car.model} (${car.year})
От: ${startDate}
До: ${endDate}
Дни: ${days}
Общо: €${totalPrice}

За да продължиш към плащането, отвори този линк:
${continueUrl}

Резервация #${reservation.id}
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Потвърди резервацията си</title>
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
                Потвърди резервацията си
              </h2>

              <p style="margin:0 0 24px 0;color:#6b7280;font-size:14px;">
                Резервация #${reservation.id}
              </p>

              <p style="margin:0 0 16px 0;">
                Здравей, <strong>${reservation.firstName} ${reservation.lastName}</strong>,
              </p>

              <p style="margin:0 0 24px 0;">
                Получихме твоята заявка за резервация. За да продължиш към плащането, натисни бутона по-долу.
              </p>

              <div style="background:#f9fafb;border-left:4px solid #10b981;padding:20px;margin:24px 0;border-radius:4px;">
                <h3 style="margin:0 0 16px 0;font-size:18px;color:#111827;">
                  Детайли по резервацията
                </h3>

                <table width="100%" cellpadding="8" cellspacing="0" border="0">
                  <tr>
                    <td style="color:#6b7280;font-size:14px;padding:8px 0;">Автомобил:</td>
                    <td style="color:#111827;font-weight:bold;font-size:14px;padding:8px 0;text-align:right;">
                      ${car.make} ${car.model} (${car.year})
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:14px;padding:8px 0;">Начална дата:</td>
                    <td style="color:#111827;font-weight:600;font-size:14px;padding:8px 0;text-align:right;">
                      ${startDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:14px;padding:8px 0;">Крайна дата:</td>
                    <td style="color:#111827;font-weight:600;font-size:14px;padding:8px 0;text-align:right;">
                      ${endDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:14px;padding:8px 0;">Дни:</td>
                    <td style="color:#111827;font-weight:600;font-size:14px;padding:8px 0;text-align:right;">
                      ${days}
                    </td>
                  </tr>
                  <tr style="border-top:2px solid #e5e7eb;">
                    <td style="color:#111827;font-size:16px;font-weight:bold;padding:16px 0 8px 0;">Общо:</td>
                    <td style="color:#10b981;font-size:20px;font-weight:bold;padding:16px 0 8px 0;text-align:right;">
                      €${totalPrice}
                    </td>
                  </tr>
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0;">
                <tr>
                  <td align="center">
                    <a
                      href="${continueUrl}"
                      style="background:#4f46e5;color:#ffffff;padding:14px 26px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:15px;"
                    >
                      Потвърди и продължи към плащане
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280;">
                Ако бутонът не работи, копирай този линк в браузъра:
              </p>

              <p style="margin:0;word-break:break-all;font-size:14px;">
                <a href="${continueUrl}" style="color:#4f46e5;">${continueUrl}</a>
              </p>

              <p style="margin:24px 0 0 0;font-size:14px;color:#6b7280;">
                Линкът е валиден за <strong>24 часа</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb;padding:20px;text-align:center;font-size:13px;color:#9ca3af;">
              © ${new Date().getFullYear()} Smart Rent
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
      to: reservation.email,
      subject,
      text,
      html,
      attachments,
    },
    'abv',
  );
}
