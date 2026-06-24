import { NextResponse } from "next/server";
import { getDb, addIfNew } from "@/lib/db";
import { getSessionUser } from "@/lib/serverSession";

export async function PUT(req, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "Admin") return NextResponse.json({ error: "Only Admins can edit transactions." }, { status: 403 });

  const { id } = await params;
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

  const database = await getDb();
  const result = await database.execute({
    sql: `UPDATE transactions SET date=?, movement_type=?, challan_no=?, part_name=?, project=?, qty=?, rejected_qty=?, from_location=?, to_location=?, remarks=? WHERE id=?`,
    args: [date, movement, challan.trim(), part.trim(), (project || "").trim(), Number(qty), rq, from.trim(), to.trim(), (remarks || "").trim(), id]
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  if (from !== "Shivkripa") await addIfNew("vendors", from.trim());
  if (to !== "Shivkripa") await addIfNew("vendors", to.trim());
  await addIfNew("parts", part.trim());
  if (project) await addIfNew("projects", project.trim());

  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "Admin") return NextResponse.json({ error: "Only Admins can delete transactions." }, { status: 403 });

  const { id } = await params;
  const database = await getDb();
  await database.execute({ sql: "DELETE FROM transactions WHERE id = ?", args: [id] });
  return NextResponse.json({ ok: true });
}
