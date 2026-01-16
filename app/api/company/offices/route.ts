import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');

  try {
    const offices = await prisma.office.findMany({});
    return NextResponse.json(offices, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch offices' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, address, latitude, longitude, companyId } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing required field: companyId' },
        { status: 400 },
      );
    }

    const office = await prisma.office.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        company: {
          connect: { id: companyId },
        },
      },
    });

    return NextResponse.json(office, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create office' },
      { status: 500 },
    );
  }
}
