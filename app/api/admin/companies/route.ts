import { NextResponse } from 'next/server';
import jwt, {
  JwtPayload,
  JsonWebTokenError,
  TokenExpiredError,
} from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { UserRepository } from '@/lib/repository/UserRepository';
import { rollbackStripeAccount } from '@/lib/services/stripe/companyStripe';
import { onboardCompany } from '@/lib/services/company/onBoardCompany';

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

export async function POST(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();
    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase();
    const maintenancePercent = body?.maintenancePercent ?? 0;

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: 'name_email_required' },
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

    const { company, mailInfo } = await onboardCompany({
      name,
      email,
      maintenancePercent: m,
    });

    return NextResponse.json(
      {
        ok: true,
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          maintenancePercent: company.maintenancePercent,
          ownerId: company.ownerId,
          stripeAccountId: company.stripeAccountId ?? null,
        },
        onboardingEmail: {
          sentTo: mailInfo.sentTo,
          devOverrideUsed: mailInfo.devOverrideUsed,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('POST /api/admin/companies error:', err);
    return NextResponse.json(
      { ok: false, error: 'company_creation_failed' },
      { status: 500 },
    );
  }
}

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



import { deleteCompanyDeep } from '@/lib/services/admin/deleteEntity';

// ...

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

    const stripeAccountId = (company as any).stripeAccountId as
      | string
      | undefined;

    await deleteCompanyDeep(Number(id));

    if (stripeAccountId) {
      try {
        await rollbackStripeAccount(stripeAccountId);
      } catch (stripeErr) {
        console.warn('Stripe rollback failed:', stripeErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/companies error:', err);

    const message = err instanceof Error ? err.message : 'delete_error';

    if (message === 'company_not_found') {
      return NextResponse.json(
        { ok: false, error: 'company_not_found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'delete_error' },
      { status: 500 },
    );
  }
}
