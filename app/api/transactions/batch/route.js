import { NextResponse } from "next/server";
import { getDb, addIfNew } from "@/lib/db";
import { getSessionUser } from "@/lib/serverSession";

// Creates several transaction rows that share one challan/date/movement/from/to
// header — e.g. one e-way-bill-style entry covering multiple parts, each with
// its own qty, rejected qty and remarks.
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { movement, date, challan, project, from, to, items } = body;

  if (!movement || !["DISPATCH", "TRANSFER", "RETURN"].includes(movement)) {
    return NextResponse.json({ error: "Invalid movement type." }, { status: 400 });
  }
  if (!challan || !from || !to) {
    return NextResponse.json({ error: "Challan, From and To are required." }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ error: "From and To locations can't be the same." }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Add at least one item." }, { status: 400 });
  }

  const cleanItems = [];
  for (const it of items) {
    const part = (it.part || "").trim();
    const qty = Number(it.qty);
    const rejectedQty = Number(it.rejectedQty) || 0;
    if (!part || !qty || qty <= 0) {
      return NextResponse.json({ error: "Every item needs a Part and a Quantity greater than 0." }, { status: 400 });
    }
    if (rejectedQty > qty) {
      return NextResponse.json({ error: `Rejected quantity for ${part} can't exceed its quantity.` }, { status: 400 });
    }
    cleanItems.push({ part, qty, rejectedQty, remarks: (it.remarks || "").trim() });
  }

  const database = await getDb();
  const createdAt = new Date().toISOString();
  const txnDate = date || createdAt.slice(0, 10);
  const challanTrim = challan.trim();
  const projectTrim = (project || "").trim();
  const fromTrim = from.trim();
  const toTrim = to.trim();

  const ids = cleanItems.map(() => "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));

  const statements = cleanItems.map((it, i) => ({
    sql: `INSERT INTO transactions
      (id, date, movement_type, challan_no, part_name, project, qty, rejected_qty, from_location, to_location, remarks, created_by, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [ids[i], txnDate, movement, challanTrim, it.part, projectTrim, it.qty, it.rejectedQty, fromTrim, toTrim, it.remarks, user.name, createdAt]
  }));

  await database.batch(statements, "write");

  if (fromTrim !== "Shivkripa") await addIfNew("vendors", fromTrim);
  if (toTrim !== "Shivkripa") await addIfNew("vendors", toTrim);
  for (const it of cleanItems) await addIfNew("parts", it.part);
  if (projectTrim) await addIfNew("projects", projectTrim);

  return NextResponse.json({ ok: true, ids });
}
