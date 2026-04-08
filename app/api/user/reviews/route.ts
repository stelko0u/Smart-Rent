import { NextResponse } from 'next/server';
import { requireAuthUserFromRequest } from '@/lib/auth';
import { ReviewRepository } from '@/lib/repository/ReviewRepository';

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function GET(req: Request) {
  try {
    const user = await requireAuthUserFromRequest(req);

    const { searchParams } = new URL(req.url);
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const pageSize = parsePositiveInt(searchParams.get('pageSize'), 6);

    const result = await ReviewRepository.findByUserPaginated(
      user.id,
      page,
      pageSize,
    );

    return NextResponse.json({
      ok: true,
      reviews: result.reviews,
      pagination: {
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        pageSize: result.pageSize,
      },
    });
  } catch (err) {
    console.error('GET /api/user/reviews error:', err);

    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
