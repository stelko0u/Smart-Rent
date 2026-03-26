import { NextResponse } from 'next/server';
import { sendForgotPasswordEmail } from '@/lib/services/auth/forgotPasswordService';

type ReqBody = {
  email?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;
    const email = typeof body.email === 'string' ? body.email : '';

    if (!email.trim()) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 },
      );
    }

    const result = await sendForgotPasswordEmail(email);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
