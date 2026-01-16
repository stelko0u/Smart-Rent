// import { NextResponse } from "next/server";

// export async function POST(_: Request) {
//   try {
//     const res = NextResponse.json({ message: "Signed out" }, { status: 200 });

//     // Clear the auth cookie (set empty value and maxAge: 0)
//     res.cookies.set("token", "", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       path: "/",
//       maxAge: 0,
//     });

//     return res;
//   } catch (err: any) {
//     console.error("Signout error:", err);
//     return NextResponse.json({ message: err?.message || "Sign out failed" }, { status: 500 });
//   }
// }
import { NextResponse } from "next/server";

export async function POST() {
  const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "token";

  // build response and clear cookie
  const res = NextResponse.json({ ok: true });
  // Clear cookie by setting empty value and maxAge=0
  try {
    // Next.js cookies API (app router)
    // depending on Next version you can use res.cookies.set(name, value, opts)
    // this should work in most recent Next versions:
    res.cookies.set(COOKIE_NAME, "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
  } catch (err) {
    // fallback: set header manually
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
