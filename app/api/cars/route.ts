import { CarRepository } from '@/lib/repositories/CarRepository';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const cars = await CarRepository.getAll();
    return NextResponse.json({ ok: true, cars });
  } catch (err) {
    console.error('GET /api/cars error:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}
