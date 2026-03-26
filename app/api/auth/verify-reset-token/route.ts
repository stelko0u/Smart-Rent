import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { PasswordResetTokenRepository } from '@/lib/repository/PasswordResetTokenRepository';
import { normalizeEmail } from '@/lib/utils/email';


export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();

    const normalizedEmail =
      typeof email === 'string' ? normalizeEmail(email) : '';
    const rawToken = typeof token === 'string' ? token.trim() : '';

    if (!normalizedEmail || !rawToken) {
      return NextResponse.json({ error: 'Missing data.' }, { status: 400 });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const record = await PasswordResetTokenRepository.findByEmailAndToken(
      normalizedEmail,
      tokenHash,
    );

    if (!record) {
      return NextResponse.json({
        valid: false,
        reason: 'Invalid token.',
      });
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      await PasswordResetTokenRepository.deleteByToken(tokenHash);

      return NextResponse.json({
        valid: false,
        reason: 'Token has expired.',
      });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('verify-reset-token error:', error);

    return NextResponse.json(
      {
        valid: false,
        reason: 'Internal error.',
      },
      { status: 500 },
    );
  }
}
