"use client";
import { useEffect, useRef, useState } from "react";
import { useAppData } from "./DataProvider";
import SelectWithAdd from "./SelectWithAdd";
import Icon from "./Icon";

function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const BLANK_HEADER = { movement: "DISPATCH", date: todayISO(), challan: "", project: "", from: "Shivkripa", to: "" };
const BLANK_ITEM = () => ({ key: Math.random().toString(36).slice(2), part: "", qty: "", rejectedQty: "0", remarks: "" });

export default function TransactionForm({ editing, onSaved, onCancelEdit }) {
  const { locations, parts, projects, addVendor, addPart, addProject, addTransaction, addTransactionBatch, updateTransaction, showToast, user } = useAppData();
  const [header, setHeader] = useState(BLANK_HEADER);
  const [items, setItems] = useState([BLANK_ITEM()]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const formRef = useRef(null);

  const isEditing = !!editing;

  // Pressing Enter in any field moves to the next field (like Tab), and
  // submits the form once you press Enter on the very last field.
  function handleFormKeyDown(e) {
    if (e.key !== "Enter" || e.defaultPrevented) return;
    const tag = e.target.tagName;
    if (tag !== "INPUT" && tag !== "SELECT") return;
    if (e.target.type === "checkbox" || e.target.type === "radio") return;
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const focusable = Array.from(form.querySelectorAll("input:not([disabled]):not([type=hidden]), select:not([disabled])"));
    const idx = focusable.indexOf(e.target);
    if (idx === -1) return;
    const next = focusable[idx + 1];
    if (next) {
      next.focus();
      if (next.tagName === "INPUT" && next.type === "text") next.select();
    } else if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    }
  }

  useEffect(() => {
    if (editing) {
      setHeader({
        movement: editing.movement,
        date: editing.date,
        challan: editing.challan,
        project: editing.project || "",
        from: editing.from,
        to: editing.to
      });
      setItems([
        {
          key: "editing",
          part: editing.part,
          qty: String(editing.qty),
          rejectedQty: String(editing.rejectedQty || 0),
          remarks: editing.remarks || ""
        }
      ]);
    } else {
      setHeader(BLANK_HEADER);
      setItems([BLANK_ITEM()]);
    }
  }, [editing]);

  function setH(key, val) {
    setHeader((h) => ({ ...h, [key]: val }));
  }
  function setItemField(key, field, val) {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, [field]: val } : it)));
  }
  function addItemRow() {
    setItems((list) => [...list, BLANK_ITEM()]);
  }
  function removeItemRow(key) {
    setItems((list) => (list.length === 1 ? list : list.filter((it) => it.key !== key)));
  }

  function handleMovementChange(m) {
    setHeader((h) => {
      const next = { ...h, movement: m };
      if (m === "DISPATCH") next.from = "Shivkripa";
      if (m === "RETURN") next.to = "Shivkripa";
      return next;
    });
  }

  function validate() {
    if (!header.challan.trim() || !header.from || !header.to) {
      return "Please fill Challan, From and To.";
    }
    if (header.from === header.to) {
      return "From and To locations can't be the same.";
    }
    for (const it of items) {
      if (!it.part || !it.qty || Number(it.qty) <= 0) {
        return "Every item needs a Part and a Quantity greater than 0.";
      }
      if (Number(it.rejectedQty || 0) > Number(it.qty)) {
        return `Rejected quantity for ${it.part} can't exceed its quantity.`;
      }
    }
    if (!isEditing) {
      const seen = new Set();
      for (const it of items) {
        if (seen.has(it.part)) return `"${it.part}" is listed more than once — combine it into a single line.`;
        seen.add(it.part);
      }
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setErr("");

    const validationError = validate();
    if (validationError) {
      setErr(validationError);
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const it = items[0];
        await updateTransaction(editing.id, {
          movement: header.movement,
          date: header.date,
          challan: header.challan.trim(),
          project: header.project.trim(),
          part: it.part,
          qty: Number(it.qty),
          rejectedQty: Number(it.rejectedQty || 0),
          from: header.from,
          to: header.to,
          remarks: it.remarks.trim()
        });
      } else if (items.length === 1) {
        const it = items[0];
        await addTransaction({
          movement: header.movement,
          date: header.date,
          challan: header.challan.trim(),
          project: header.project.trim(),
          part: it.part,
          qty: Number(it.qty),
          rejectedQty: Number(it.rejectedQty || 0),
          from: header.from,
          to: header.to,
          remarks: it.remarks.trim()
        });
      } else {
        await addTransactionBatch({
          movement: header.movement,
          date: header.date,
          challan: header.challan.trim(),
          project: header.project.trim(),
          from: header.from,
          to: header.to,
          items: items.map((it) => ({
            part: it.part,
            qty: Number(it.qty),
            rejectedQty: Number(it.rejectedQty || 0),
            remarks: it.remarks.trim()
          }))
        });
      }
      setHeader(BLANK_HEADER);
      setItems([BLANK_ITEM()]);
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
        <h3 className="text-[15.5px] font-semibold">{isEditing ? "Update Transaction" : "New Transaction"}</h3>
        {!isEditing && <div className="text-[11.5px] text-ink-faint">Add multiple items to one challan, like an e-way bill</div>}
      </div>
      <div className="panel-body">
        <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="field-label">Movement Type</label>
              <select className="field-input" value={header.movement} onChange={(e) => handleMovementChange(e.target.value)}>
                <option value="DISPATCH">DISPATCH</option>
                <option value="TRANSFER">TRANSFER</option>
                <option value="RETURN">RETURN</option>
              </select>
            </div>
            <div>
              <label className="field-label">Date</label>
              <input type="date" className="field-input" value={header.date} onChange={(e) => setH("date", e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Challan Number</label>
              <input className="field-input" placeholder="e.g. CH-1003" value={header.challan} onChange={(e) => setH("challan", e.target.value)} required />
            </div>
            <SelectWithAdd
              label="Project"
              options={projects}
              value={header.project}
              onChange={(v) => setH("project", v)}
              onAdd={addProject}
              allowEmpty
              emptyLabel="No project"
            />
            <SelectWithAdd label="From Location" options={locations} value={header.from} onChange={(v) => setH("from", v)} onAdd={addVendor} placeholder="Select location" />
            <SelectWithAdd label="To Location" options={locations} value={header.to} onChange={(v) => setH("to", v)} onAdd={addVendor} placeholder="Select location" />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="field-label !mb-0">{items.length > 1 ? "Items" : "Item"}</label>
              {!isEditing && (
                <button type="button" className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={addItemRow}>
                  <span className="flex items-center gap-1">
                    <Icon name="plus" size={13} /> Add Item
                  </span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {items.map((it, idx) => (
                <div key={it.key} className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_2fr_auto] gap-3 items-start pb-3 border-b border-line last:border-b-0 last:pb-0">
                  <SelectWithAdd label={idx === 0 ? "Part Name" : undefined} options={parts} value={it.part} onChange={(v) => setItemField(it.key, "part", v)} onAdd={addPart} placeholder="Select a part" />
                  <div>
                    {idx === 0 && <label className="field-label">Quantity</label>}
                    <input type="number" min="0" step="any" className="field-input" placeholder="0" value={it.qty} onChange={(e) => setItemField(it.key, "qty", e.target.value)} required />
                  </div>
                  <div>
                    {idx === 0 && <label className="field-label">Rejected Qty</label>}
                    <input type="number" min="0" step="any" className="field-input" placeholder="0" value={it.rejectedQty} onChange={(e) => setItemField(it.key, "rejectedQty", e.target.value)} />
                  </div>
                  <div>
                    {idx === 0 && <label className="field-label">Remarks</label>}
                    <input className="field-input" placeholder="Optional note" value={it.remarks} onChange={(e) => setItemField(it.key, "remarks", e.target.value)} />
                  </div>
                  {!isEditing && (
                    <div className={idx === 0 ? "pt-6" : ""}>
                      <button
                        type="button"
                        className="p-2 rounded-md text-ink-soft hover:bg-cream hover:text-rust disabled:opacity-30"
                        disabled={items.length === 1}
                        onClick={() => removeItemRow(it.key)}
                        title="Remove item"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {items.length === 1 && (
              <div className="text-[12px] text-ink-faint mt-1.5">Only Rejected Qty on RETURN entries is used.</div>
            )}
          </div>

          {err && <div className="text-rust text-[12px] font-semibold mt-2.5">{err}</div>}

          <div className="flex items-center gap-2.5 mt-4">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving…" : isEditing ? "Update Transaction" : items.length > 1 ? `Save Transaction (${items.length} items)` : "Save Transaction"}
            </button>
            {isEditing && (
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
