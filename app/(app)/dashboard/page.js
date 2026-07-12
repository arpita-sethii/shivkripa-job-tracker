"use client";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/DataProvider";
import { currentPositionRows, pendingAtVendorRows, computeKpis } from "@/lib/calculations";
import KpiCard from "@/components/KpiCard";
import HistoryModal from "@/components/HistoryModal";

function fmtNum(n) {
  n = Number(n) || 0;
  return Math.round(n * 100) / 100 % 1 === 0 ? Math.round(n).toLocaleString("en-IN") : (Math.round(n * 100) / 100).toLocaleString("en-IN");
}

export default function DashboardPage() {
  const { transactions, projectFilter, search, loading } = useAppData();
  const [historyChallan, setHistoryChallan] = useState(null);

  const txns = useMemo(() => (projectFilter === "All" ? transactions : transactions.filter((t) => t.project === projectFilter)), [transactions, projectFilter]);

  const k = useMemo(() => computeKpis(txns), [txns]);
  const pos = useMemo(() => {
    const rows = currentPositionRows(txns);
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => r.challan.toLowerCase().includes(q));
  }, [txns, search]);
  const pending = useMemo(() => {
    const rows = pendingAtVendorRows(txns);
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => r.challan.toLowerCase().includes(q));
  }, [txns, search]);

  if (loading) return <div className="text-ink-faint text-sm py-10">Loading…</div>;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5.5">
        <KpiCard label="Total Challans" value={k.total} foot={projectFilter === "All" ? "All projects" : projectFilter} color="steel" />
        <KpiCard label="At Vendors" value={k.atVendor} foot="Outside Shivkripa right now" color="ochre" />
        <KpiCard label="At Shivkripa" value={k.atHome} foot="Back in-house" color="forest" />
        <KpiCard label="Rejected Qty" value={fmtNum(k.rejected)} foot="Across all returns" color="rust" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3 className="text-[15.5px] font-semibold">Current Position</h3>
          <div className="text-[11.5px] text-ink-faint">Click a row to see the full challan history</div>
        </div>
        <div className="panel-body overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Challan</th>
                <th>Part</th>
                <th>Project</th>
                <th>Qty</th>
                <th>Current Location</th>
              </tr>
            </thead>
            <tbody>
              {pos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-ink-faint py-7 text-[13px]">
                    No matching challans yet — add a transaction to see this populate.
                  </td>
                </tr>
              ) : (
                pos.map((r) => (
                  <tr key={r.challan + r.part + r.location} className="cursor-pointer hover:bg-[#fbf7ec]" onClick={() => setHistoryChallan(r.challan)}>
                    <td className="font-mono font-bold">
                      {r.challan}
                      {r.split && <span className="pill ml-1.5">split</span>}
                    </td>
                    <td>{r.part}</td>
                    <td className="text-ink-soft text-[12.5px]">{r.project || "—"}</td>
                    <td className="font-mono">{fmtNum(r.qty)}</td>
                    <td>
                      {r.location === "Shivkripa" ? (
                        <span className="pill bg-[#e4eee6] text-forest border-transparent">Shivkripa</span>
                      ) : (
                        <span className="pill bg-ochre-bg text-ochre border-transparent">{r.location}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3 className="text-[15.5px] font-semibold">Pending at Vendors</h3>
          <div className="text-[11.5px] text-ink-faint">Quantity currently sitting outside Shivkripa</div>
        </div>
        <div className="panel-body overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Challan</th>
                <th>Part</th>
                <th>Qty Pending</th>
                <th>Vendor</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-ink-faint py-7 text-[13px]">
                    Nothing pending at vendors right now.
                  </td>
                </tr>
              ) : (
                pending.map((r) => (
                  <tr key={r.challan + r.part + r.location} className="cursor-pointer hover:bg-[#fbf7ec]" onClick={() => setHistoryChallan(r.challan)}>
                    <td className="font-mono font-bold">{r.challan}</td>
                    <td>{r.part}</td>
                    <td className="font-mono">{fmtNum(r.qty)}</td>
                    <td>
                      <span className="pill bg-ochre-bg text-ochre border-transparent">{r.location}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {historyChallan && <HistoryModal challan={historyChallan} allTransactions={transactions} onClose={() => setHistoryChallan(null)} />}
    </>
  );
}
