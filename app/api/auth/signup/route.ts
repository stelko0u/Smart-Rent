import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';
import { sendVerificationEmail } from '../../../lib/mail';

export const runtime = 'nodejs';

type ReqBody = {
  email?: string;
  password?: string;
  name?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;
    const email = String(body.email ?? '')
      .toLowerCase()
      .trim();
    const password = String(body.password ?? '');
    const name = body.name ? String(body.name).trim() : null;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Unable to create account' },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        emailVerified: false,
      },
      select: { id: true, email: true, name: true },
    });

    try {
      await sendVerificationEmail(user.email, user.id);
    } catch (sendErr) {
      console.error('sendVerificationEmail failed:', sendErr);
    }

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/auth/signup error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Server error' },
      { status: 500 },
    );
  }
}
