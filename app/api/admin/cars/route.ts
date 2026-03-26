import { NextResponse } from 'next/server';
import { CarRepository } from '@/lib/repository/CarRepository';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;
  try {
    const cars = await CarRepository.findMany();
    return NextResponse.json({ ok: true, cars });
  } catch (err) {
    console.error('GET /api/admin/cars error:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;
  try {
    const body = await req.json();
    const { id } = body;
    if (!id)
      return NextResponse.json(
        { ok: false, error: 'id_required' },
        { status: 400 },
      );
    const car = await CarRepository.findById(Number(id));
    if (!car)
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        { status: 404 },
      );
    await CarRepository.delete(Number(id));
    if (!car)
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        { status: 404 },
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/cars error:', err);
    return NextResponse.json(
      { ok: false, error: 'delete_error' },
      { status: 500 },
    );
  }
}
