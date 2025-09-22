import { NextResponse } from "next/server";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "accessToken";

export async function POST() {
  const reply = NextResponse.json({ success: true });
  reply.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0, // apaga
  });
  return reply;
}
