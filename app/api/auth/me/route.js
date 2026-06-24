import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });
  const payload = await verifySession(token);
  if (!payload) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { name: payload.name, role: payload.role } });
}
