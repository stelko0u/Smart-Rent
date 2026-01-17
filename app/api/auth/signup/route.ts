import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userService } from '../../../lib/api';
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

const existing = await userService.getByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Unable to create account' },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await userService.create({
      email,
      password: hashed,
      name: name || undefined,
      emailVerified: false,
    });

    // Return only the fields we want to expose
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

try {
      await sendVerificationEmail(user.email, user.id);
    } catch (sendErr) {
      console.error('sendVerificationEmail failed:', sendErr);
    }

    return NextResponse.json({ ok: true, user: userResponse }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/auth/signup error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Server error' },
      { status: 500 },
    );
  }
}
