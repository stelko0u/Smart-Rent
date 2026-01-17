import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { userService, companyService } from "../../../lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, maintenancePercent } = body;

    if (!name || !email || !password || maintenancePercent === undefined) {
      return NextResponse.json(
        { error: "Missing fields (name, email, password, maintenancePercent required)" },
        { status: 400 }
      );
    }

    const maintenance = Number(maintenancePercent);
    if (!Number.isFinite(maintenance) || maintenance < 0 || maintenance > 100) {
      return NextResponse.json({ error: "Invalid maintenancePercent (0-100)" }, { status: 400 });
    }

const existing = await userService.getByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    // Create user first
    const user = await userService.create({
      email,
      password: hashed,
      name,
      role: "COMPANY" as any
    });
    
    // Then create company
    await companyService.create({
      ownerId: user.id,
      name,
      maintenancePercent: maintenance,
      email
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error("/api/admin/company POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
