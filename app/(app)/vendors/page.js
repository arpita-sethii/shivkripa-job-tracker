"use client";
import { useMemo } from "react";
import { useAppData } from "@/components/DataProvider";
import { vendorPerformance } from "@/lib/calculations";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

function fmtNum(n) {
  n = Number(n) || 0;
  return Math.round(n * 100) / 100 % 1 === 0 ? Math.round(n).toLocaleString("en-IN") : (Math.round(n * 100) / 100).toLocaleString("en-IN");
}

export default function VendorsPage() {
  const { transactions, projectFilter, loading } = useAppData();
  const txns = useMemo(() => (projectFilter === "All" ? transactions : transactions.filter((t) => t.project === projectFilter)), [transactions, projectFilter]);
  const perf = useMemo(() => vendorPerformance(txns), [txns]);

  if (loading) return <div className="text-ink-faint text-sm py-10">Loading…</div>;

  return (
    <>
      <div className="mb-4">
        <h3 className="font-display text-[19px]">Vendor Performance</h3>
        <div className="text-[12px] text-ink-faint mt-1">
          Received vs returned vs rejected, per vendor{projectFilter !== "All" ? ` · ${projectFilter}` : ""}
        </div>
      </div>

      {perf.length === 0 ? (
        <div className="panel">
          <div className="panel-body text-center text-ink-faint py-7 text-[13px]">No vendor activity yet.</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-5">
            {perf.map((v) => (
              <div key={v.vendor} className="panel !mb-0 p-4">
                <h4 className="text-[15px] font-semibold mb-2.5">{v.vendor}</h4>
                <Metric label="Received" value={fmtNum(v.received)} />
                <Metric label="Returned" value={fmtNum(v.returned)} />
                <Metric label="Rejected" value={fmtNum(v.rejected)} />
                <Metric label="Rejection %" value={v.pct.toFixed(1) + "%"} />
                <Metric label="Challans Processed" value={v.challanCount} />
                <div className="h-1.5 rounded bg-line mt-2 overflow-hidden">
                  <div className="h-full bg-rust" style={{ width: `${Math.min(100, v.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            <div className="panel">
              <div className="panel-head">
                <h3 className="text-[15px] font-semibold">Received vs Returned</h3>
              </div>
              <div className="panel-body" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4d9bc" />
                    <XAxis dataKey="vendor" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="received" name="Received" fill="#385c73" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="returned" name="Returned" fill="#33573f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="panel">
              <div className="panel-head">
                <h3 className="text-[15px] font-semibold">Rejection % by Vendor</h3>
              </div>
              <div className="panel-body" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4d9bc" />
                    <XAxis dataKey="vendor" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="pct" name="Rejection %" fill="#a1462e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="flex justify-between text-[12.5px] py-1 text-ink-soft">
      <span>{label}</span>
      <b className="font-mono text-ink">{value}</b>
    </div>
  );
}
