import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/serverSession";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const database = await getDb();
  const result = await database.execute("SELECT name FROM vendors ORDER BY name ASC");
  return NextResponse.json({ vendors: result.rows.map((r) => r.name) });
}

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Vendor name required." }, { status: 400 });
  if (name === "Shivkripa") return NextResponse.json({ error: "That name is reserved." }, { status: 400 });
  const database = await getDb();
  await database.execute({ sql: "INSERT OR IGNORE INTO vendors(name) VALUES (?)", args: [name] });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "Admin") return NextResponse.json({ error: "Only Admins can edit vendors." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const oldName = (body.oldName || "").trim();
  const newName = (body.newName || "").trim();
  if (!oldName || !newName) return NextResponse.json({ error: "Both old and new vendor name are required." }, { status: 400 });
  if (oldName === "Shivkripa" || newName === "Shivkripa") return NextResponse.json({ error: "That name is reserved." }, { status: 400 });

  const database = await getDb();
  const exists = await database.execute({ sql: "SELECT 1 FROM vendors WHERE name = ?", args: [oldName] });
  if (exists.rows.length === 0) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

  if (newName !== oldName) {
    const clash = await database.execute({ sql: "SELECT 1 FROM vendors WHERE name = ?", args: [newName] });
    if (clash.rows.length > 0) return NextResponse.json({ error: "A vendor with that name already exists." }, { status: 400 });
  }

  await database.batch(
    [
      { sql: "UPDATE vendors SET name = ? WHERE name = ?", args: [newName, oldName] },
      { sql: "UPDATE transactions SET from_location = ? WHERE from_location = ?", args: [newName, oldName] },
      { sql: "UPDATE transactions SET to_location = ? WHERE to_location = ?", args: [newName, oldName] }
    ],
    "write"
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "Admin") return NextResponse.json({ error: "Only Admins can delete vendors." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") || "").trim();
  if (!name) return NextResponse.json({ error: "Vendor name required." }, { status: 400 });

  const database = await getDb();
  const inUse = await database.execute({
    sql: "SELECT COUNT(*) as c FROM transactions WHERE from_location = ? OR to_location = ?",
    args: [name, name]
  });
  if (Number(inUse.rows[0].c) > 0) {
    return NextResponse.json(
      { error: `Can't delete — used in ${inUse.rows[0].c} transaction(s). Rename it instead, or remove those transactions first.` },
      { status: 400 }
    );
  }

  await database.execute({ sql: "DELETE FROM vendors WHERE name = ?", args: [name] });
  return NextResponse.json({ ok: true });
}
