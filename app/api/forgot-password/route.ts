import { NextResponse } from 'next/server';
import { sendForgotPasswordEmail } from '@/lib/services/auth/forgotPasswordService';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const result = await sendForgotPasswordEmail(String(email ?? ''));

    return NextResponse.json(result);
  } catch (err) {
    console.error('forgot-password API error:', err);

    if (err instanceof Error && err.message === 'INVALID_EMAIL') {
      return NextResponse.json(
        { error: 'Невалиден имейл адрес.' },
        { status: 400 },
      );
    }

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
