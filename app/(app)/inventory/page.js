"use client";
import { useMemo } from "react";
import { useAppData } from "@/components/DataProvider";
import { inventoryByLocation } from "@/lib/calculations";

function fmtNum(n) {
  n = Number(n) || 0;
  return Math.round(n * 100) / 100 % 1 === 0 ? Math.round(n).toLocaleString("en-IN") : (Math.round(n * 100) / 100).toLocaleString("en-IN");
}

export default function InventoryPage() {
  const { transactions, projectFilter, loading } = useAppData();
  const txns = useMemo(() => (projectFilter === "All" ? transactions : transactions.filter((t) => t.project === projectFilter)), [transactions, projectFilter]);
  const inv = useMemo(() => inventoryByLocation(txns), [txns]);
  const locs = useMemo(() => Object.keys(inv).sort((a, b) => (a === "Shivkripa" ? -1 : b === "Shivkripa" ? 1 : a.localeCompare(b))), [inv]);

  if (loading) return <div className="text-ink-faint text-sm py-10">Loading…</div>;

  return (
    <>
      <div className="mb-4">
        <h3 className="font-display text-[19px]">Inventory by Location</h3>
        <div className="text-[12px] text-ink-faint mt-1">
          Calculated live from every transaction{projectFilter !== "All" ? ` · ${projectFilter}` : ""}
        </div>
      </div>

      {locs.length === 0 ? (
        <div className="panel">
          <div className="panel-body text-center text-ink-faint py-7 text-[13px]">
            No stock yet — log a transaction to see this populate automatically.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {locs.map((loc) => {
            const d = inv[loc];
            const parts = Object.keys(d.parts).sort();
            return (
              <div key={loc} className="panel !mb-0">
                <div className="bg-cream px-4 py-3 border-b border-dashed border-rule flex items-center gap-2">
                  <span className="font-bold text-[14px]">{loc}</span>
                  <span className="text-[11.5px] text-ink-soft ml-auto">{fmtNum(d.total)} total</span>
                </div>
                <div>
                  {parts.map((p) => {
                    const cell = d.parts[p];
                    return (
                      <div key={p} className="flex justify-between items-baseline px-4 py-2 text-[13px] border-b border-dotted border-line last:border-0 gap-2">
                        <span className="truncate">{p}</span>
                        <span className="text-right flex-shrink-0">
                          <span className="font-mono font-bold">{fmtNum(cell.qty)}</span>
                          {cell.rejected > 0 && (
                            <span className="block text-[10.5px] font-bold text-rust mt-0.5">{fmtNum(cell.rejected)} rejected</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
