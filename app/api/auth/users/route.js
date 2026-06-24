import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/serverSession";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "Admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const database = await getDb();
  const result = await database.execute("SELECT id, name, username, role, created_at FROM users ORDER BY created_at ASC");
  return NextResponse.json({ users: result.rows });
}

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "Admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";
  const role = body.role === "Admin" ? "Admin" : "Operator";

  if (!name || !username || password.length < 6) {
    return NextResponse.json({ error: "Name, username and a password of at least 6 characters are required." }, { status: 400 });
  }

  const database = await getDb();
  const existing = await database.execute({ sql: "SELECT id FROM users WHERE username = ?", args: [username] });
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 400 });
  }

  const id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const hash = await hashPassword(password);
  await database.execute({
    sql: "INSERT INTO users(id,name,username,password_hash,role,created_at) VALUES (?,?,?,?,?,?)",
    args: [id, name, username, hash, role, new Date().toISOString()]
  });

  return NextResponse.json({ ok: true });
}
