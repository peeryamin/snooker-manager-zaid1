import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth";

const USERNAME = process.env.OWNER_USERNAME || "admin";
const PASSWORD = process.env.OWNER_PASSWORD || "admin123";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (username === USERNAME && password === PASSWORD) {
    await createSessionCookie(username);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
}
