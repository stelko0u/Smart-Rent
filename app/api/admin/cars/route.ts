import { NextResponse } from "next/server";
import jwt, { JwtPayload, JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import prisma from "../../../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "token";

function getTokenFromRequest(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.substring(7).trim();
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

async function requireAdmin(req: Request) {
  if (!JWT_SECRET)
    return {
      ok: false,
      resp: NextResponse.json({ error: "server_misconfigured" }, { status: 500 }),
    };
  const token = getTokenFromRequest(req);
  if (!token) return { ok: false, resp: NextResponse.json({ error: "no_token" }, { status: 401 }) };
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload | Record<string, any>;
    const userId = Number((payload as any).userId ?? payload.sub ?? null);
    if (!userId || Number.isNaN(userId))
      return { ok: false, resp: NextResponse.json({ error: "invalid_token" }, { status: 401 }) };
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user)
      return { ok: false, resp: NextResponse.json({ error: "user_not_found" }, { status: 404 }) };
    if (user.role !== "ADMIN")
      return { ok: false, resp: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
    return { ok: true, user };
  } catch (err) {
    if (err instanceof TokenExpiredError)
      return { ok: false, resp: NextResponse.json({ error: "token_expired" }, { status: 401 }) };
    if (err instanceof JsonWebTokenError)
      return { ok: false, resp: NextResponse.json({ error: "invalid_token" }, { status: 401 }) };
    console.error("requireAdmin error:", err);
    return { ok: false, resp: NextResponse.json({ error: "internal_error" }, { status: 500 }) };
  }
}

export async function GET(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;
  try {
    const cars = await prisma.car.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        pricePerDay: true,
        company: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ ok: true, cars });
  } catch (err) {
    console.error("GET /api/admin/cars error:", err);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
    const car = await prisma.car.findUnique({ where: { id: Number(id) } });
    if (!car) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    await prisma.car.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/cars error:", err);
    return NextResponse.json({ ok: false, error: "delete_error" }, { status: 500 });
  }
}
