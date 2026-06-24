"use client";
import { useEffect, useState } from "react";
import { useAppData } from "./DataProvider";
import SelectWithAdd from "./SelectWithAdd";

function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const BLANK = { movement: "DISPATCH", date: todayISO(), challan: "", project: "", part: "", qty: "", rejectedQty: "0", from: "Shivkripa", to: "", remarks: "" };

export default function TransactionForm({ editing, onSaved, onCancelEdit }) {
  const { locations, parts, projects, addVendor, addPart, addProject, addTransaction, updateTransaction, showToast, user } = useAppData();
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        movement: editing.movement,
        date: editing.date,
        challan: editing.challan,
        project: editing.project || "",
        part: editing.part,
        qty: String(editing.qty),
        rejectedQty: String(editing.rejectedQty || 0),
        from: editing.from,
        to: editing.to,
        remarks: editing.remarks || ""
      });
    } else {
      setForm(BLANK);
    }
  }, [editing]);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleMovementChange(m) {
    setForm((f) => {
      const next = { ...f, movement: m };
      if (m === "DISPATCH") next.from = "Shivkripa";
      if (m === "RETURN") next.to = "Shivkripa";
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setErr("");

    if (!form.challan.trim() || !form.part || !form.from || !form.to || !form.qty || Number(form.qty) <= 0) {
      setErr("Please fill Challan, Part, Quantity (>0), From and To.");
      return;
    }
    if (form.from === form.to) {
      setErr("From and To locations can't be the same.");
      return;
    }
    if (Number(form.rejectedQty || 0) > Number(form.qty)) {
      setErr("Rejected quantity can't exceed quantity.");
      return;
    }

    const payload = {
      movement: form.movement,
      date: form.date,
      challan: form.challan.trim(),
      project: form.project.trim(),
      part: form.part,
      qty: Number(form.qty),
      rejectedQty: Number(form.rejectedQty || 0),
      from: form.from,
      to: form.to,
      remarks: form.remarks.trim()
    };

    setSaving(true);
    try {
      if (editing) {
        await updateTransaction(editing.id, payload);
      } else {
        await addTransaction(payload);
      }
      setForm(BLANK);
      onSaved && onSaved();
    } catch (e2) {
      setErr(e2.message || "Save failed — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 className="text-[15.5px] font-semibold">{editing ? "Update Transaction" : "New Transaction"}</h3>
      </div>
      <div className="panel-body">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="field-label">Movement Type</label>
              <select className="field-input" value={form.movement} onChange={(e) => handleMovementChange(e.target.value)}>
                <option value="DISPATCH">DISPATCH</option>
                <option value="TRANSFER">TRANSFER</option>
                <option value="RETURN">RETURN</option>
              </select>
            </div>
            <div>
              <label className="field-label">Date</label>
              <input type="date" className="field-input" value={form.date} onChange={(e) => set("date", e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Challan Number</label>
              <input className="field-input" placeholder="e.g. CH-1003" value={form.challan} onChange={(e) => set("challan", e.target.value)} required />
            </div>
            <SelectWithAdd
              label="Project"
              options={projects}
              value={form.project}
              onChange={(v) => set("project", v)}
              onAdd={addProject}
              allowEmpty
              emptyLabel="No project"
            />

            <SelectWithAdd label="Part Name" options={parts} value={form.part} onChange={(v) => set("part", v)} onAdd={addPart} placeholder="Select a part" />
            <div>
              <label className="field-label">Quantity</label>
              <input type="number" min="0" step="any" className="field-input" placeholder="0" value={form.qty} onChange={(e) => set("qty", e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Rejected Quantity</label>
              <input type="number" min="0" step="any" className="field-input" placeholder="0" value={form.rejectedQty} onChange={(e) => set("rejectedQty", e.target.value)} />
            </div>
            <div className="text-[12px] text-ink-faint pt-6">Only relevant on RETURN entries</div>

            <SelectWithAdd label="From Location" options={locations} value={form.from} onChange={(v) => set("from", v)} onAdd={addVendor} placeholder="Select location" />
            <SelectWithAdd label="To Location" options={locations} value={form.to} onChange={(v) => set("to", v)} onAdd={addVendor} placeholder="Select location" />
            <div className="col-span-2">
              <label className="field-label">Remarks</label>
              <input className="field-input" placeholder="Optional note" value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
            </div>
          </div>

          {err && <div className="text-rust text-[12px] font-semibold mt-2.5">{err}</div>}

          <div className="flex items-center gap-2.5 mt-4">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving…" : editing ? "Update Transaction" : "Save Transaction"}
            </button>
            {editing && (
              <button type="button" className="btn btn-ghost" onClick={onCancelEdit}>
                Cancel
              </button>
            )}
            <span className="text-ink-faint text-[12px]">
              Logged as {user.name} ({user.role})
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
