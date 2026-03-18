import { PasswordResetTokenRepository } from '@/lib/repositories/PasswordResetTokenRepository';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Missing data.' }, { status: 400 });
    }

    const record = await PasswordResetTokenRepository.findByToken(token);

    if (!record || record.email !== email) {
      return NextResponse.json({ valid: false, reason: 'Invalid token.' });
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, reason: 'Token has expired.' });
    }

    return NextResponse.json({ valid: true });
  } catch (err: any) {
    console.error('verify-reset-token error:', err);
    return NextResponse.json(
      { valid: false, reason: 'Internal error.' },
      { status: 500 },
    );
  }
}
