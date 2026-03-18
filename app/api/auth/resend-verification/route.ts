import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '../../../../lib/mail';
import { UserRepository } from '@/lib/repositories/userRepository';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await UserRepository.findByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this email.' },
        { status: 404 },
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified.' },
        { status: 400 },
      );
    }

    await sendVerificationEmail(user.email, user.id);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent.',
    });
  } catch (err: any) {
    console.error('resend-verification API error:', err);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV !== 'production'
            ? String(err)
            : 'Internal server error.',
      },
      { status: 500 },
    );
  }
}
