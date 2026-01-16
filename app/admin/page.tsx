import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminShell from "../components/admin/AdminShell";

async function getMe() {
  try {
    const all = (await cookies()).getAll();
    const tokenCookieName =
      process.env.AUTH_COOKIE_NAME ?? process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "token";
    const named = (await cookies()).get(tokenCookieName);
    const cookieHeader = named
      ? `${named.name}=${named.value}`
      : all.map((c) => `${c.name}=${c.value}`).join("; ");

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    const url = new URL("/api/auth/me", base).toString();

    const res = await fetch(url, {
      cache: "no-store",
      headers: { cookie: cookieHeader, Accept: "application/json" },
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json?.ok && json.user) return json.user;
    return null;
  } catch (err) {
    console.error("getMe error:", err);
    return null;
  }
}

export default async function AdminPage() {
  const me = await getMe();
  if (!me || (typeof me.role === "string" ? me.role.toUpperCase() !== "ADMIN" : true)) {
    redirect("/signin");
  }

  // pass me (serializable) to client shell
  return <AdminShell me={{ id: me.id, name: me.name, role: me.role }} />;
}