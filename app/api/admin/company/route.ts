import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { UserRepository } from '@/lib/repository/UserRepository';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, maintenancePercent } = body;

    if (!name || !email || !password || maintenancePercent === undefined) {
      return NextResponse.json(
        {
          error:
            'Missing fields (name, email, password, maintenancePercent required)',
        },
        { status: 400 },
      );
    }

    const maintenance = Number(maintenancePercent);
    if (!Number.isFinite(maintenance) || maintenance < 0 || maintenance > 100) {
      return NextResponse.json(
        { error: 'Invalid maintenancePercent (0-100)' },
        { status: 400 },
      );
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      email,
      password: hashed,
      name,
      role: 'COMPANY',
      emailVerified: false,
      mustChangePassword: false,
    });

    try {
      await CompanyRepository.create({
        ownerId: user.id,
        name,
        email,
        maintenancePercent: maintenance,
      });
    } catch (e) {
      try {
        await UserRepository.delete(user.id);
      } catch (delErr) {
        console.error(
          'Failed to rollback user after company create error:',
          delErr,
        );
      }

      console.warn('Create company failed:', e);

      return NextResponse.json(
        { error: 'Failed creating company. Check uniqueness and schema.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error('/api/admin/company POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
