import { NextResponse } from 'next/server';
import jwt, {
  JwtPayload,
  JsonWebTokenError,
  TokenExpiredError,
} from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRepository } from '@/lib/repositories/userRepository';
import { CompanyRepository } from '@/lib/repositories/CompanyRepository';


const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'token';

function getTokenFromRequest(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7).trim();
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(
    new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[2]) : null;
}

async function requireAdmin(req: Request) {
  if (!JWT_SECRET)
    return {
      ok: false,
      resp: NextResponse.json(
        { error: 'server_misconfigured' },
        { status: 500 },
      ),
    };
  const token = getTokenFromRequest(req);
  if (!token)
    return {
      ok: false,
      resp: NextResponse.json({ error: 'no_token' }, { status: 401 }),
    };
  try {
    const payload = jwt.verify(token, JWT_SECRET) as
      | JwtPayload
      | Record<string, any>;
    const userId = Number((payload as any).userId ?? payload.sub ?? null);
    if (!userId || Number.isNaN(userId))
      return {
        ok: false,
        resp: NextResponse.json({ error: 'invalid_token' }, { status: 401 }),
      };

    const user = await UserRepository.findById(userId);
    if (!user)
      return {
        ok: false,
        resp: NextResponse.json({ error: 'user_not_found' }, { status: 404 }),
      };
    if (user.role !== 'ADMIN')
      return {
        ok: false,
        resp: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
      };
    return { ok: true, user };
  } catch (err) {
    if (err instanceof TokenExpiredError)
      return {
        ok: false,
        resp: NextResponse.json({ error: 'token_expired' }, { status: 401 }),
      };
    if (err instanceof JsonWebTokenError)
      return {
        ok: false,
        resp: NextResponse.json({ error: 'invalid_token' }, { status: 401 }),
      };
    console.error('requireAdmin error:', err);
    return {
      ok: false,
      resp: NextResponse.json({ error: 'internal_error' }, { status: 500 }),
    };
  }
}

// GET - Извличане на всички компании
export async function GET(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const companies = await CompanyRepository.findMany();
    return NextResponse.json({ ok: true, companies });
  } catch (err) {
    console.error('GET /api/admin/companies error:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}

// POST - Създаване на нова компания
export async function POST(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();
    const { name, email, maintenancePercent = 0, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: 'name_email_password_required' },
        { status: 400 },
      );
    }

    const m = Number(maintenancePercent);
    if (!Number.isFinite(m) || m < 0 || m > 100) {
      return NextResponse.json(
        { ok: false, error: 'invalid_maintenance_percent' },
        { status: 400 },
      );
    }

    // Проверка дали имейлът вече съществува
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: 'email_already_exists' },
        { status: 409 },
      );
    }

    const existingCompany = await CompanyRepository.findByEmail(email);
    if (existingCompany) {
      return NextResponse.json(
        { ok: false, error: 'company_email_already_exists' },
        { status: 409 },
      );
    }

    // Хеширане на паролата
    const hashed = await bcrypt.hash(password, 10);

    // Създаване на потребител за компанията
    const user = await UserRepository.create({
      email,
      password: hashed,
      name: name,
      role: 'COMPANY',
      emailVerified: true,
    });

    try {
      // Създаване на компанията
      const company = await CompanyRepository.create({
        ownerId: user.id,
        name,
        email,
        maintenancePercent: m,
      });

      // Обновяване на потребителя с companyId (ако е необходимо)
      if (user.companyId !== company.id) {
        await UserRepository.update(user.id, { companyId: company.id });
      }

      return NextResponse.json(
        {
          ok: true,
          company: {
            id: company.id,
            name: company.name,
            email: company.email,
            maintenancePercent: company.maintenancePercent,
            ownerId: company.ownerId,
          },
        },
        { status: 201 },
      );
    } catch (companyErr) {
      // Rollback - изтриване на потребителя, ако създаването на компанията не успее
      try {
        await UserRepository.delete(user.id);
      } catch (delErr) {
        console.error('Failed to rollback user creation:', delErr);
      }
      console.error('Company creation failed:', companyErr);
      return NextResponse.json(
        { ok: false, error: 'company_creation_failed' },
        { status: 500 },
      );
    }
  } catch (err) {
    console.error('POST /api/admin/companies error:', err);
    return NextResponse.json(
      { ok: false, error: 'server_error' },
      { status: 500 },
    );
  }
}

// PATCH - Актуализиране на компания
export async function PATCH(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();
    const { id, maintenancePercent, name, email } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id_required' },
        { status: 400 },
      );
    }

    const updates: Partial<{
      name: string;
      email: string;
      maintenancePercent: number;
    }> = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (email !== undefined) {
      // Проверка дали новият имейл не е зает от друга компания
      const existingCompany = await CompanyRepository.findByEmail(email);
      if (existingCompany && existingCompany.id !== Number(id)) {
        return NextResponse.json(
          { ok: false, error: 'email_already_in_use' },
          { status: 409 },
        );
      }
      updates.email = email;
    }

    if (maintenancePercent !== undefined) {
      const m = Number(maintenancePercent);
      if (!Number.isFinite(m) || m < 0 || m > 100) {
        return NextResponse.json(
          { ok: false, error: 'invalid_maintenance_percent' },
          { status: 400 },
        );
      }
      updates.maintenancePercent = m;
    }

    const company = await CompanyRepository.update(Number(id), updates);

    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'company_not_found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, company });
  } catch (err) {
    console.error('PATCH /api/admin/companies error:', err);
    return NextResponse.json(
      { ok: false, error: 'update_error' },
      { status: 500 },
    );
  }
}

// DELETE - Изтриване на компания
export async function DELETE(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id_required' },
        { status: 400 },
      );
    }

    const company = await CompanyRepository.findById(Number(id));
    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'company_not_found' },
        { status: 404 },
      );
    }

    // Изтриване на компанията
    await CompanyRepository.delete(Number(id));

    // Опит за изтриване на owner потребителя
    if (company.ownerId) {
      try {
        await UserRepository.delete(company.ownerId);
      } catch (err) {
        console.warn('Failed to delete company owner user:', err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/companies error:', err);
    return NextResponse.json(
      { ok: false, error: 'delete_error' },
      { status: 500 },
    );
  }
}
