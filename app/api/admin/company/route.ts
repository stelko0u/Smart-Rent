import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../../lib/prisma";

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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name,
        role: "COMPANY",
      },
    });

    try {
      await prisma.company.create({
        data: {
          ownerId: user.id,
          name,
          maintenancePercent: maintenance,
          email,
        },
      });
    } catch (e) {
      try {
        await prisma.user.delete({ where: { id: user.id } });
      } catch (delErr) {
        console.error("Failed to rollback user after company create error:", delErr);
      }
      console.warn("Create company failed:", e);
      return NextResponse.json(
        { error: "Failed creating company. Check uniqueness and schema." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error("/api/admin/company POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
