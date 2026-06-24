import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { checkPassword, signSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const database = await getDb();
  const result = await database.execute({
    sql: "SELECT * FROM users WHERE lower(username) = ?",
    args: [username]
  });

  const user = result.rows[0];
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const ok = await checkPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = await signSession({ sub: user.id, name: user.name, role: user.role });
  const res = NextResponse.json({ ok: true, user: { name: user.name, role: user.role } });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
