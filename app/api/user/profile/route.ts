import { NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { UserRepository } from '@/lib/repository/UserRepository';

export async function PUT(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);

    const body = await req.json();
    const { name, phone, address, city, country, postalCode, dateOfBirth } =
      body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (postalCode !== undefined) updateData.postalCode = postalCode;

    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    const updated = await UserRepository.update(user.id, updateData);

    return NextResponse.json({
      ok: true,
      user: updated,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('PUT /api/user/profile error:', err);

    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 },
    );
  }
}
