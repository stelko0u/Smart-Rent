
import { NextResponse } from "next/server";

export async function POST() {
  const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "token";


  const res = NextResponse.json({ ok: true });

  try {
 
    res.cookies.set(COOKIE_NAME, "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
  } catch (err) {
    const cookieStr = `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`;
    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Set-Cookie": cookieStr },
    });
  }

  return res;
}
