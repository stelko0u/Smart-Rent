import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/services/auth/resetPasswordService';
import { handleResetPasswordError } from '@/lib/errors/handleResetPasswordError';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await resetPassword({
      email: String(body?.email || ''),
      token: String(body?.token || ''),
      password: String(body?.password || ''),
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleResetPasswordError(err);
  }
}
