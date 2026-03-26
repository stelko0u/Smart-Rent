import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getAdminUserRoleById } from '@/lib/repository/admin/AdminRepository';
import { getAdminDashboardStats } from '@/lib/services/admin/adminDashboardServices';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

type DecodedToken = {
  userId: number;
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Неоторизиран достъп' },
        { status: 401 },
      );
    }

    let decoded: DecodedToken;

    try {
      decoded = verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json({ error: 'Невалиден токен' }, { status: 401 });
    }

    const userResult = await getAdminUserRoleById(decoded.userId);

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: 'Потребителят не съществува' },
        { status: 403 },
      );
    }

    const user = userResult[0];

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Нямате права за достъп' },
        { status: 403 },
      );
    }

    const stats = await getAdminDashboardStats();

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Admin dashboard error:', error);

    return NextResponse.json(
      { error: 'Грешка при зареждане на статистиките' },
      { status: 500 },
    );
  }
}
