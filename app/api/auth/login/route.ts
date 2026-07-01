import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (username === "zaid" && password === "Zaid990340") {
    await createSessionCookie(username);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
}
