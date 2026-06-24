import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/serverSession";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const database = await getDb();
  const result = await database.execute("SELECT name FROM projects ORDER BY name ASC");
  return NextResponse.json({ projects: result.rows.map((r) => r.name) });
}

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Project name required." }, { status: 400 });
  const database = await getDb();
  await database.execute({ sql: "INSERT OR IGNORE INTO projects(name) VALUES (?)", args: [name] });
  return NextResponse.json({ ok: true });
}
