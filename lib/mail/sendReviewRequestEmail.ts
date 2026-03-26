import fs from 'fs';
import path from 'path';
import Mail from 'nodemailer/lib/mailer';

import { sendMail } from '@/lib/mail/mailer';
import { createReviewEmailToken } from '@/lib/services/reviews/reviewEmailToken';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SITE_URL;

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function sendReviewRequestEmail(input: {
  reservation: {
    id: number;
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    startDate: Date | string;
    endDate: Date | string;
  };
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
  };
}) {
  if (!APP_URL) {
    throw new Error('APP_URL not configured');
  }

  const token = createReviewEmailToken({
    reservationId: input.reservation.id,
    carId: input.car.id,
    userId: input.reservation.userId,
    email: input.reservation.email,
  });

  const reviewUrl = `${APP_URL}/review/${encodeURIComponent(token)}`;

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
  const customerName =
    `${input.reservation.firstName} ${input.reservation.lastName}`.trim() ||
    'клиент';

  const vehicleName = `${input.car.make} ${input.car.model} (${input.car.year})`;
  const startDate = formatDate(input.reservation.startDate);
  const endDate = formatDate(input.reservation.endDate);

  const subject = `Как мина наемът на ${input.car.make} ${input.car.model}?`;

  const text = `Здравей, ${customerName},

Твоята резервация #${input.reservation.id} приключи успешно.

Автомобил: ${vehicleName}
Период: ${startDate} - ${endDate}

Ще се радваме да оставиш кратко ревю:
${reviewUrl}

Благодарим,
Smart Rent
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Остави ревю</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
          <tr>
            <td align="center" style="background:#4f46e5;padding:28px;color:#ffffff;">
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
                Как мина твоят наем?
              </h2>

              <p style="margin:0 0 20px 0;color:#6b7280;font-size:14px;">
                Резервация #${input.reservation.id}
              </p>

              <p style="margin:0 0 16px 0;">
                Здравей, <strong>${customerName}</strong>,
              </p>

              <p style="margin:0 0 24px 0;">
                Резервацията ти приключи успешно. Ще се радваме да споделиш впечатленията си за автомобила.
              </p>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:20px;margin:24px 0;border-radius:10px;">
                <table width="100%" cellpadding="6" cellspacing="0" border="0">
                  <tr>
                    <td style="color:#6b7280;font-size:14px;">Автомобил:</td>
                    <td style="color:#111827;font-weight:bold;font-size:14px;text-align:right;">
                      ${vehicleName}
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:14px;">Период:</td>
                    <td style="color:#111827;font-weight:600;font-size:14px;text-align:right;">
                      ${startDate} - ${endDate}
                    </td>
                  </tr>
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0;">
                <tr>
                  <td align="center">
                    <a
                      href="${reviewUrl}"
                      style="background:#4f46e5;color:#ffffff;padding:14px 26px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:15px;"
                    >
                      Остави ревю
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280;">
                Ако бутонът не работи, отвори този линк:
              </p>

              <p style="margin:0;word-break:break-all;font-size:14px;">
                <a href="${reviewUrl}" style="color:#4f46e5;">${reviewUrl}</a>
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
      to: input.reservation.email,
      subject,
      text,
      html,
      attachments,
    },
  );
}
