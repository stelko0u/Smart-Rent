import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { UserRepository } from '@/lib/repositories/userRepository';
import { PasswordResetTokenRepository } from '@/lib/repositories/PasswordResetTokenRepository';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function createTransporter() {
  const ABV_USER = process.env.ABV_USER;
  const ABV_PASS = process.env.ABV_PASS;

  if (ABV_USER && ABV_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.abv.bg',
      port: 465,
      secure: true,
      auth: { user: ABV_USER, pass: ABV_PASS },
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
      tls: { rejectUnauthorized: false },
    });
  }

  throw new Error('Липсва конфигурация за имейл (ABV_USER/ABV_PASS).');
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !EMAIL_REGEX.test(String(email).toLowerCase().trim())) {
      return NextResponse.json(
        { error: 'Невалиден имейл адрес.' },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await UserRepository.findByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'There is no user with this email.' },
        { status: 404 },
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const id = crypto.randomBytes(16).toString('hex'); // Generate unique ID
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 час

    await PasswordResetTokenRepository.deleteByEmail(normalizedEmail);

    await PasswordResetTokenRepository.create({
      id,
      email: normalizedEmail,
      token,
      expiresAt,
    });

    const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${host}/reset-password?token=${token}&email=${encodeURIComponent(
      normalizedEmail,
    )}`;

    // Настройка на транспорт
    const transporter = await createTransporter();

    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        process.env.ABV_USER ||
        `no-reply@${new URL(host).hostname}`,
      to: normalizedEmail,
      subject: 'Инструкции за нулиране на паролата',
      html: `
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8" />
  <title>Нулиране на парола – SmartRent</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0070f3; padding:24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:0.5px;">
                SmartRent
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin-top:0; color:#111827; font-size:20px;">
                Нулиране на паролата
              </h2>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                Здравей,
              </p>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                Получихме заявка за нулиране на паролата ти в <strong>SmartRent</strong>.
                Натисни бутона по-долу, за да зададеш нова парола.
              </p>

              <!-- Button -->
              <div style="text-align:center; margin:32px 0;">
                <a href="${resetLink}"
                   style="
                     display:inline-block;
                     background:#0070f3;
                     color:#ffffff;
                     padding:14px 28px;
                     font-size:16px;
                     font-weight:600;
                     text-decoration:none;
                     border-radius:8px;
                   ">
                  Нулирай паролата
                </a>
              </div>

              <p style="color:#6b7280; font-size:14px; line-height:1.6;">
                Ако бутонът не работи, копирай и постави този линк в браузъра си:
              </p>

              <p style="word-break:break-all; color:#0070f3; font-size:14px;">
                <a href="${resetLink}" style="color:#0070f3; text-decoration:none;">
                  ${resetLink}
                </a>
              </p>

              <p style="color:#6b7280; font-size:14px; line-height:1.6; margin-top:24px;">
                Ако не си поискал нулиране на парола, можеш спокойно да игнорираш този имейл.
              </p>

              <p style="color:#374151; font-size:14px; margin-top:32px;">
                Поздрави,<br />
                <strong>Екипът на SmartRent</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:20px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} SmartRent. Всички права запазени.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
    });

    return NextResponse.json({
      success: true,
      message: 'Имейлът е изпратен успешно.',
    });
  } catch (err: any) {
    console.error('forgot-password API error:', err);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV !== 'production'
            ? String(err)
            : 'Вътрешна грешка.',
      },
      { status: 500 },
    );
  }
}
