import { NextRequest, NextResponse } from "next/server";

/**
 * Връща информация за компанията от /api/auth/me (препраща cookies).
 * Очаква auth endpoint да върне нещо като { ok: true, user: { companyId, companyName, role } } или { company: {...}, role: "company" }.
 */
export async function GET(req: NextRequest) {
  try {
    const origin =
      req.nextUrl?.origin ??
      `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host")}`;
    const meRes = await fetch(`${origin}/api/auth/me`, {
      method: "GET",
      headers: { Accept: "application/json", Cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });

    if (!meRes.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await meRes.json();

    const rawRole = data?.role ?? data?.user?.role ?? data?.user?.type ?? null;
    const role = typeof rawRole === "string" ? rawRole.toLowerCase().trim() : null;
    if (role !== "company") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Опитайте да намерите company id/name в няколко места
    const companyId = data?.company?.id ?? data?.user?.companyId ?? data?.user?.id ?? null;
    const companyName =
      data?.company?.name ?? data?.user?.companyName ?? data?.user?.name ?? "Company";

    return NextResponse.json({ company: { id: companyId, name: companyName } });
  } catch (err) {
    console.error("company/me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
