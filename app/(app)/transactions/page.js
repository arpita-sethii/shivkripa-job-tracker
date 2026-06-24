"use client";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/DataProvider";
import TransactionForm from "@/components/TransactionForm";
import Stamp from "@/components/Stamp";
import HistoryModal from "@/components/HistoryModal";
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

export default function TransactionsPage() {
  const { transactions, projectFilter, search, user, deleteTransaction, askConfirm, showToast } = useAppData();
  const [editing, setEditing] = useState(null);
  const [historyChallan, setHistoryChallan] = useState(null);
  const isAdmin = user.role === "Admin";

  const visible = useMemo(() => {
    let rows = transactions;
    if (projectFilter !== "All") rows = rows.filter((t) => t.project === projectFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((t) => t.challan.toLowerCase().includes(q));
    }
    return rows.slice().sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  }, [transactions, projectFilter, search]);

  function handleEdit(t) {
    if (!isAdmin) {
      showToast("Only Admins can edit transactions.", true);
      return;
    }
    setEditing(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function handleDelete(t) {
    askConfirm(`Delete transaction ${t.challan} (${t.movement}, qty ${t.qty})? This cannot be undone.`, async () => {
      try {
        await deleteTransaction(t.id);
      } catch (e) {
        showToast(e.message || "Delete failed.", true);
      }
    });
  }

  return (
    <>
      <TransactionForm editing={editing} onSaved={() => setEditing(null)} onCancelEdit={() => setEditing(null)} />

      <div className="panel">
        <div className="panel-head">
          <h3 className="text-[15.5px] font-semibold">All Transactions</h3>
          <div className="text-[11.5px] text-ink-faint">{visible.length} record(s)</div>
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
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="text-center text-ink-faint py-7 text-[13px]">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                visible.map((t) => (
                  <tr key={t.id}>
                    <td className="font-mono text-[12.5px]">{fmtDate(t.date)}</td>
                    <td>
                      <Stamp movement={t.movement} />
                    </td>
                    <td className="font-mono font-bold cursor-pointer" onClick={() => setHistoryChallan(t.challan)}>
                      {t.challan}
                    </td>
                    <td>{t.part}</td>
                    <td className="text-[12.5px] text-ink-soft">{t.project || "—"}</td>
                    <td className="font-mono">{fmtNum(t.qty)}</td>
                    <td className="font-mono">{t.rejectedQty ? fmtNum(t.rejectedQty) : "—"}</td>
                    <td>{t.from}</td>
                    <td>{t.to}</td>
                    <td className="text-[12.5px] text-ink-soft">{t.remarks || "—"}</td>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="p-1 rounded-md text-ink-soft hover:bg-cream hover:text-ink" onClick={() => handleEdit(t)} title="Edit">
                            <Icon name="edit" />
                          </button>
                          <button className="p-1 rounded-md text-rust hover:bg-rust-bg" onClick={() => handleDelete(t)} title="Delete">
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    )}
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
