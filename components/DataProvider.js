"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const DataContext = createContext(null);

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useAppData must be used inside DataProvider");
  return ctx;
}

async function jsonFetch(url, options) {
  const res = await fetch(url, options);
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function DataProvider({ user, children }) {
  const [transactions, setTransactions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [parts, setParts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [t, v, p, pr] = await Promise.all([
        jsonFetch("/api/transactions"),
        jsonFetch("/api/vendors"),
        jsonFetch("/api/parts"),
        jsonFetch("/api/projects")
      ]);
      setTransactions(t.transactions || []);
      setVendors(v.vendors || []);
      setParts(p.parts || []);
      setProjects(pr.projects || []);
    } catch (err) {
      showToast(err.message || "Could not load data.", true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function showToast(msg, isError) {
    setToast({ msg, error: !!isError });
    setTimeout(() => setToast(null), 2600);
  }
  function askConfirm(message, onConfirm) {
    setConfirmState({ message, onConfirm });
  }
  function resolveConfirm(yes) {
    const cb = confirmState && confirmState.onConfirm;
    setConfirmState(null);
    if (yes && cb) cb();
  }

  async function addTransaction(payload) {
    await jsonFetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    showToast("Transaction recorded.");
    await refresh();
  }
  async function addTransactionBatch(payload) {
    await jsonFetch("/api/transactions/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    showToast(`Transaction recorded (${payload.items.length} item${payload.items.length > 1 ? "s" : ""}).`);
    await refresh();
  }
  async function updateTransaction(id, payload) {
    await jsonFetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    showToast("Transaction updated.");
    await refresh();
  }
  async function deleteTransaction(id) {
    await jsonFetch(`/api/transactions/${id}`, { method: "DELETE" });
    showToast("Transaction deleted.");
    await refresh();
  }
  async function addVendor(name) {
    await jsonFetch("/api/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    await refresh();
  }
  async function renameVendor(oldName, newName) {
    await jsonFetch("/api/vendors", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oldName, newName }) });
    showToast("Vendor renamed.");
    await refresh();
  }
  async function deleteVendor(name) {
    await jsonFetch(`/api/vendors?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    showToast("Vendor deleted.");
    await refresh();
  }
  async function addPart(name) {
    await jsonFetch("/api/parts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    await refresh();
  }
  async function renamePart(oldName, newName) {
    await jsonFetch("/api/parts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oldName, newName }) });
    showToast("Part renamed.");
    await refresh();
  }
  async function deletePart(name) {
    await jsonFetch(`/api/parts?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    showToast("Part deleted.");
    await refresh();
  }
  async function addProject(name) {
    await jsonFetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    await refresh();
  }
  async function renameProject(oldName, newName) {
    await jsonFetch("/api/projects", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oldName, newName }) });
    showToast("Project renamed.");
    await refresh();
  }
  async function deleteProject(name) {
    await jsonFetch(`/api/projects?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    showToast("Project deleted.");
    await refresh();
  }

  const locations = useMemo(() => ["Shivkripa", ...vendors], [vendors]);

  const value = {
    user,
    transactions,
    vendors,
    parts,
    projects,
    locations,
    loading,
    projectFilter,
    setProjectFilter,
    search,
    setSearch,
    refresh,
    addTransaction,
    addTransactionBatch,
    updateTransaction,
    deleteTransaction,
    addVendor,
    renameVendor,
    deleteVendor,
    addPart,
    renamePart,
    deletePart,
    addProject,
    renameProject,
    deleteProject,
    toast,
    showToast,
    confirmState,
    askConfirm,
    resolveConfirm
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
