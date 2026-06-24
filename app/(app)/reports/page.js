"use client";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/DataProvider";
import Icon from "@/components/Icon";

function fmtDate(d) {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
function fmtNum(n) {
  n = Number(n) || 0;
  return Math.round(n * 100) / 100 % 1 === 0 ? Math.round(n).toLocaleString("en-IN") : (Math.round(n * 100) / 100).toLocaleString("en-IN");
}
function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export default function ReportsPage() {
  const { transactions, vendors, parts, projectFilter, showToast } = useAppData();
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", vendor: "All", part: "All", challan: "" });

  const rows = useMemo(() => {
    let r = transactions;
    if (projectFilter !== "All") r = r.filter((t) => t.project === projectFilter);
    if (filters.dateFrom) r = r.filter((t) => t.date >= filters.dateFrom);
    if (filters.dateTo) r = r.filter((t) => t.date <= filters.dateTo);
    if (filters.vendor !== "All") r = r.filter((t) => t.from === filters.vendor || t.to === filters.vendor);
    if (filters.part !== "All") r = r.filter((t) => t.part === filters.part);
    if (filters.challan.trim()) r = r.filter((t) => t.challan.toLowerCase().includes(filters.challan.trim().toLowerCase()));
    return r.slice().sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  }, [transactions, projectFilter, filters]);

  function set(key, val) {
    setFilters((f) => ({ ...f, [key]: val }));
  }

  const headers = ["Date", "Movement Type", "Challan No", "Part Name", "Project", "Quantity", "Rejected Qty", "From Location", "To Location", "Remarks"];
  function toAoa() {
    return rows.map((t) => [t.date, t.movement, t.challan, t.part, t.project || "", t.qty, t.rejectedQty || 0, t.from, t.to, t.remarks || ""]);
  }

  function exportCsv() {
    if (rows.length === 0) return showToast("No records to export.", true);
    const csv = [headers, ...toAoa()]
      .map((r) => r.map((v) => { const s = String(v); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; }).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    download(blob, `shivkripa-job-work-${todayISO()}.csv`);
    showToast("CSV exported.");
  }

  async function exportXlsx() {
    if (rows.length === 0) return showToast("No records to export.", true);
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([headers, ...toAoa()]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `shivkripa-job-work-${todayISO()}.xlsx`);
    showToast("Excel file exported.");
  }

  async function exportPdf() {
    if (rows.length === 0) return showToast("No records to export.", true);
    const { jsPDF } = await import("jspdf");
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Shivkripa Job Work Tracker — Transactions Report", 14, 14);
    doc.setFontSize(9);
    doc.text("Generated " + todayISO(), 14, 20);
    autoTable(doc, { head: [headers], body: toAoa(), startY: 26, styles: { fontSize: 7 }, headStyles: { fillColor: [51, 87, 63] } });
    doc.save(`shivkripa-job-work-${todayISO()}.pdf`);
    showToast("PDF exported.");
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h3 className="text-[15.5px] font-semibold">Filters</h3>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <div>
              <label className="field-label">Date From</label>
              <input type="date" className="field-input" value={filters.dateFrom} onChange={(e) => set("dateFrom", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Date To</label>
              <input type="date" className="field-input" value={filters.dateTo} onChange={(e) => set("dateTo", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Vendor</label>
              <select className="field-input" value={filters.vendor} onChange={(e) => set("vendor", e.target.value)}>
                <option value="All">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Part Name</label>
              <select className="field-input" value={filters.part} onChange={(e) => set("part", e.target.value)}>
                <option value="All">All Parts</option>
                {parts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Challan Number</label>
            <input className="field-input" placeholder="Search challan…" value={filters.challan} onChange={(e) => set("challan", e.target.value)} />
          </div>
          <div className="flex items-center gap-2.5 mt-4 flex-wrap">
            <button className="btn btn-primary" style={{ padding: "8px 13px", fontSize: 12.5 }} onClick={exportCsv}>
              <Icon name="download" size={14} /> Export CSV
            </button>
            <button className="btn btn-ghost" style={{ padding: "8px 13px", fontSize: 12.5 }} onClick={exportXlsx}>
              <Icon name="download" size={14} /> Export Excel
            </button>
            <button className="btn btn-ghost" style={{ padding: "8px 13px", fontSize: 12.5 }} onClick={exportPdf}>
              <Icon name="download" size={14} /> Export PDF
            </button>
            <span className="text-ink-faint text-[12px]">{rows.length} record(s) match</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3 className="text-[15.5px] font-semibold">Preview</h3>
        </div>
        <div className="panel-body overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Movement</th>
                <th>Challan</th>
                <th>Part</th>
                <th>Project</th>
                <th>Qty</th>
                <th>Rejected</th>
                <th>From</th>
                <th>To</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-ink-faint py-7 text-[13px]">
                    No records match these filters.
                  </td>
                </tr>
              ) : (
                rows.slice(0, 200).map((t) => (
                  <tr key={t.id}>
                    <td className="font-mono text-[12.5px]">{fmtDate(t.date)}</td>
                    <td>{t.movement}</td>
                    <td className="font-mono font-bold">{t.challan}</td>
                    <td>{t.part}</td>
                    <td className="text-[12.5px] text-ink-soft">{t.project || "—"}</td>
                    <td className="font-mono">{fmtNum(t.qty)}</td>
                    <td className="font-mono">{t.rejectedQty ? fmtNum(t.rejectedQty) : "—"}</td>
                    <td>{t.from}</td>
                    <td>{t.to}</td>
                    <td className="text-[12.5px] text-ink-soft">{t.remarks || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {rows.length > 200 && (
            <div className="text-ink-faint text-[12px] pt-2.5">Showing first 200 of {rows.length} — export includes all matching records.</div>
          )}
        </div>
      </div>
    </>
  );
}
