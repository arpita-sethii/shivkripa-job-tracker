import { NextResponse } from "next/server";
import { getDb, addIfNew } from "@/lib/db";
import { getSessionUser } from "@/lib/serverSession";

function rowToTxn(r) {
  return {
    id: r.id,
    date: r.date,
    movement: r.movement_type,
    challan: r.challan_no,
    part: r.part_name,
    project: r.project,
    qty: r.qty,
    rejectedQty: r.rejected_qty,
    from: r.from_location,
    to: r.to_location,
    remarks: r.remarks,
    createdBy: r.created_by,
    createdAt: r.created_at
  };
}

export async function GET(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project");
  const challan = searchParams.get("challan");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const vendor = searchParams.get("vendor");
  const part = searchParams.get("part");

  let sql = "SELECT * FROM transactions WHERE 1=1";
  const args = [];
  if (project) { sql += " AND project = ?"; args.push(project); }
  if (challan) { sql += " AND lower(challan_no) LIKE ?"; args.push(`%${challan.toLowerCase()}%`); }
  if (dateFrom) { sql += " AND date >= ?"; args.push(dateFrom); }
  if (dateTo) { sql += " AND date <= ?"; args.push(dateTo); }
  if (vendor) { sql += " AND (from_location = ? OR to_location = ?)"; args.push(vendor, vendor); }
  if (part) { sql += " AND part_name = ?"; args.push(part); }
  sql += " ORDER BY date DESC, created_at DESC";

  const database = await getDb();
  const result = await database.execute({ sql, args });
  return NextResponse.json({ transactions: result.rows.map(rowToTxn) });
}

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { movement, date, challan, project, part, qty, rejectedQty, from, to, remarks } = body;

  if (!movement || !["DISPATCH", "TRANSFER", "RETURN"].includes(movement)) {
    return NextResponse.json({ error: "Invalid movement type." }, { status: 400 });
  }
  if (!challan || !part || !from || !to || qty === undefined || qty === null || Number(qty) <= 0) {
    return NextResponse.json({ error: "Challan, Part, Quantity (>0), From and To are required." }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ error: "From and To locations can't be the same." }, { status: 400 });
  }
  const rq = Number(rejectedQty) || 0;
  if (rq > Number(qty)) {
    return NextResponse.json({ error: "Rejected quantity can't exceed quantity." }, { status: 400 });
  }

  const id = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const createdAt = new Date().toISOString();
  const txnDate = date || createdAt.slice(0, 10);

  const database = await getDb();
  await database.execute({
    sql: `INSERT INTO transactions
      (id, date, movement_type, challan_no, part_name, project, qty, rejected_qty, from_location, to_location, remarks, created_by, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, txnDate, movement, challan.trim(), part.trim(), (project || "").trim(), Number(qty), rq, from.trim(), to.trim(), (remarks || "").trim(), user.name, createdAt]
  });

  if (from !== "Shivkripa") await addIfNew("vendors", from.trim());
  if (to !== "Shivkripa") await addIfNew("vendors", to.trim());
  await addIfNew("parts", part.trim());
  if (project) await addIfNew("projects", project.trim());

  return NextResponse.json({ ok: true, id });
}
