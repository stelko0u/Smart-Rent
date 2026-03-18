import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '../../../../lib/mail';
import { UserRepository } from '@/lib/repositories/userRepository';

export const runtime = 'nodejs';

type ReqBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
};

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;

    const firstName = String(body.firstName ?? '').trim();
    const lastName = String(body.lastName ?? '').trim();
    const email = String(body.email ?? '')
      .toLowerCase()
      .trim();
    const password = String(body.password ?? '');
    const phone = String(body.phone ?? '').trim();
    const address = String(body.address ?? '').trim();
    const city = String(body.city ?? '').trim();
    const country = String(body.country ?? '').trim();
    const postalCode = String(body.postalCode ?? '').trim();
    const dateOfBirth = String(body.dateOfBirth ?? '').trim();

    const emailRegex = /^\S+@\S+\.\S+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{10,}$/;
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
    const postalCodeRegex = /^[A-Za-z0-9\s\-]{3,10}$/;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !phone ||
      !address ||
      !city ||
      !country ||
      !postalCode ||
      !dateOfBirth
    ) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 },
      );
    }

    if (firstName.length < 2) {
      return NextResponse.json(
        { error: 'First name must be at least 2 characters' },
        { status: 400 },
      );
    }

    if (lastName.length < 2) {
      return NextResponse.json(
        { error: 'Last name must be at least 2 characters' },
        { status: 400 },
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 },
      );
    }

    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            'Password must be at least 10 characters and include uppercase, lowercase, number, and special character',
        },
        { status: 400 },
      );
    }

    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 },
      );
    }

    if (address.length < 5) {
      return NextResponse.json(
        { error: 'Address must be at least 5 characters' },
        { status: 400 },
      );
    }

    if (city.length < 2) {
      return NextResponse.json(
        { error: 'City must be at least 2 characters' },
        { status: 400 },
      );
    }

    if (country.length < 2) {
      return NextResponse.json(
        { error: 'Country must be at least 2 characters' },
        { status: 400 },
      );
    }

    if (!postalCodeRegex.test(postalCode)) {
      return NextResponse.json(
        { error: 'Invalid postal code' },
        { status: 400 },
      );
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime()) || dob >= new Date()) {
      return NextResponse.json(
        { error: 'Invalid date of birth' },
        { status: 400 },
      );
    }

    if (calculateAge(dateOfBirth) < 18) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old' },
        { status: 400 },
      );
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Unable to create account' },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      email,
      password: hashed,
      phone,
      address,
      city,
      country,
      postalCode,
      dateOfBirth: dob,
      name: `${firstName} ${lastName}`,
      emailVerified: false,
      role: 'USER',
    });

    try {
      await sendVerificationEmail(user.email, user.id);
    } catch (sendErr) {
      console.error('sendVerificationEmail failed:', sendErr);
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          address: user.address,
          city: user.city,
          country: user.country,
          postalCode: user.postalCode,
          dateOfBirth: user.dateOfBirth,
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error('POST /api/auth/signup error:', err);

    const message = err instanceof Error ? err.message : 'Server error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
