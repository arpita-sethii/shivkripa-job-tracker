"use client";
import { useState } from "react";

export default function SelectWithAdd({ label, options, value, onChange, onAdd, placeholder = "Select…", allowEmpty = false, emptyLabel = "—" }) {
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const [busy, setBusy] = useState(false);

  function handleSelectChange(e) {
    const v = e.target.value;
    if (v === "__add__") {
      setAdding(true);
      setNewVal("");
      return;
    }
    onChange(v);
  }

  async function handleAddConfirm() {
    const name = newVal.trim();
    if (!name) return;
    setBusy(true);
    try {
      await onAdd(name);
      onChange(name);
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  if (adding) {
    return (
      <div>
        {label && <label className="field-label">{label}</label>}
        <div className="flex gap-2">
          <input
            autoFocus
            className="field-input"
            placeholder={`New ${label ? label.toLowerCase() : "value"}…`}
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddConfirm())}
          />
          <button type="button" disabled={busy || !newVal.trim()} onClick={handleAddConfirm} className="btn btn-primary btn-sm-pad" style={{ padding: "9px 12px" }}>
            Add
          </button>
          <button type="button" onClick={() => setAdding(false)} className="btn btn-ghost" style={{ padding: "9px 12px" }}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && <label className="field-label">{label}</label>}
      <select className="field-input" value={value || ""} onChange={handleSelectChange}>
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {!allowEmpty && !value && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value="__add__">+ Add new…</option>
      </select>
    </div>
  );
}
