"use client";
import { Fragment } from "react";
import { perChallanPartBalances } from "@/lib/calculations";
import Stamp from "./Stamp";
import { CloseIconButton } from "./Overlays";

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

export default function HistoryModal({ challan, allTransactions, onClose }) {
  const rows = allTransactions
    .filter((t) => t.challan === challan)
    .slice()
    .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));
  const perPart = perChallanPartBalances(allTransactions, challan);
  const distinctParts = Array.from(new Set(rows.map((r) => r.part)));
  const sample = rows[0] || {};

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100] p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-paper rounded-2xl max-w-[680px] w-full max-h-[86vh] overflow-y-auto shadow-2xl">
        <div className="px-5.5 py-4 border-b border-rule flex items-center justify-between sticky top-0 bg-paper">
          <div>
            <h3 className="font-mono font-bold text-[17px]">{challan}</h3>
            <div className="text-[12px] text-ink-soft">
              {distinctParts.length > 1 ? `${distinctParts.length} items` : sample.part} · {sample.project || "—"}
            </div>
          </div>
          <CloseIconButton onClick={onClose} />
        </div>
        <div className="px-5.5 py-5">
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wide font-bold text-ink-soft mb-2">Where the material is right now</div>
            {perPart.every((p) => p.balances.length === 0) ? (
              <span className="text-ink-faint text-[13px]">No quantity left to show.</span>
            ) : (
              <div className="flex flex-col gap-2.5">
                {perPart.map(({ part, balances }) => (
                  <div key={part}>
                    {distinctParts.length > 1 && <div className="text-[12px] font-semibold mb-1">{part}</div>}
                    {balances.length === 0 ? (
                      <span className="text-ink-faint text-[12.5px]">No quantity left.</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {balances.map((b) => (
                          <div key={b.location} className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-cream border border-line">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">{b.location}</span>
                            <span className="font-mono font-bold text-[16px]">{fmtNum(b.qty)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Movement</th>
                {distinctParts.length > 1 && <th>Part</th>}
                <th>From</th>
                <th>To</th>
                <th>Qty</th>
                <th>Rejected</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <Fragment key={t.id}>
                  <tr>
                    <td className="font-mono text-[12.5px]">{fmtDate(t.date)}</td>
                    <td>
                      <Stamp movement={t.movement} />
                    </td>
                    {distinctParts.length > 1 && <td>{t.part}</td>}
                    <td>{t.from}</td>
                    <td>{t.to}</td>
                    <td className="font-mono">{fmtNum(t.qty)}</td>
                    <td className="font-mono">{t.rejectedQty ? fmtNum(t.rejectedQty) : "—"}</td>
                  </tr>
                  {t.remarks && (
                    <tr>
                      <td></td>
                      <td colSpan={distinctParts.length > 1 ? 6 : 5} className="text-[12px] text-ink-faint !pt-0 !pb-2.5">
                        — {t.remarks}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
