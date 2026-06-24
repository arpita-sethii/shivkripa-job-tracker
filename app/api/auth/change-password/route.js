import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/serverSession";
import { checkPassword, hashPassword } from "@/lib/auth";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const database = await getDb();
  const result = await database.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [user.id] });
  const row = result.rows[0];
  if (!row) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const ok = await checkPassword(currentPassword, row.password_hash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

  const newHash = await hashPassword(newPassword);
  await database.execute({ sql: "UPDATE users SET password_hash = ? WHERE id = ?", args: [newHash, user.id] });
  return NextResponse.json({ ok: true });
}
