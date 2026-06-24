"use client";
import { useAppData } from "./DataProvider";
import Icon from "./Icon";

export function Toast() {
  const { toast } = useAppData();
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] px-4.5 py-3 rounded-xl text-white text-[13.5px] font-semibold shadow-2xl -rotate-1 ${
        toast.error ? "bg-rust" : "bg-forest-dark"
      }`}
    >
      {toast.error ? "✕ " : "✓ "}
      {toast.msg}
    </div>
  );
}

export function ConfirmDialog() {
  const { confirmState, resolveConfirm } = useAppData();
  if (!confirmState) return null;
  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100] p-5" onClick={(e) => e.target === e.currentTarget && resolveConfirm(false)}>
      <div className="bg-paper rounded-2xl max-w-[380px] w-full shadow-2xl">
        <div className="p-5">
          <h3 className="font-display text-[17px] mb-2.5">Please confirm</h3>
          <p className="text-[13px] text-ink-soft leading-relaxed">{confirmState.message}</p>
        </div>
        <div className="px-5 py-3.5 border-t border-rule flex justify-end gap-2.5">
          <button className="btn btn-ghost" onClick={() => resolveConfirm(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={() => resolveConfirm(true)}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export function CloseIconButton({ onClick }) {
  return (
    <button onClick={onClick} className="p-1 rounded-md text-ink-soft hover:bg-cream hover:text-ink">
      <Icon name="close" />
    </button>
  );
}
