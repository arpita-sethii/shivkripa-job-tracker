"use client";
import { useEffect, useState } from "react";
import { useAppData } from "@/components/DataProvider";
import SelectWithAdd from "@/components/SelectWithAdd";
import Icon from "@/components/Icon";

export default function SettingsPage() {
  const {
    user,
    showToast,
    askConfirm,
    vendors,
    parts,
    projects,
    addVendor,
    renameVendor,
    deleteVendor,
    addPart,
    renamePart,
    deletePart,
    addProject,
    renameProject,
    deleteProject
  } = useAppData();
  const isAdmin = user.role === "Admin";

  return (
    <>
      <ChangePassword showToast={showToast} />
      {isAdmin && <ManageUsers showToast={showToast} />}
      {isAdmin && (
        <ManageReferenceData
          vendors={vendors}
          parts={parts}
          projects={projects}
          addVendor={addVendor}
          renameVendor={renameVendor}
          deleteVendor={deleteVendor}
          addPart={addPart}
          renamePart={renamePart}
          deletePart={deletePart}
          addProject={addProject}
          renameProject={renameProject}
          deleteProject={deleteProject}
          showToast={showToast}
          askConfirm={askConfirm}
        />
      )}
    </>
  );
}

function ChangePassword({ showToast }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      showToast("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e2) {
      showToast(e2.message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 className="text-[15.5px] font-semibold">Change Your Password</h3>
      </div>
      <div className="panel-body">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[480px]">
          <div>
            <label className="field-label">Current Password</label>
            <input type="password" className="field-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">New Password</label>
            <input type="password" className="field-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageUsers({ showToast }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Operator");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/auth/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed.");
      showToast("User added.");
      setName("");
      setUsername("");
      setPassword("");
      setRole("Operator");
      load();
    } catch (e2) {
      showToast(e2.message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3 className="text-[15.5px] font-semibold">Team Members</h3>
        <div className="text-[11.5px] text-ink-faint">Admin only</div>
      </div>
      <div className="panel-body">
        <table className="mb-4">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td className="font-mono">{u.username}</td>
                <td>
                  <span className="pill">{u.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[760px]">
          <div>
            <label className="field-label">Name</label>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Username</label>
            <input className="field-input" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="field-label">Role</label>
            <select className="field-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Operator">Operator</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Adding…" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageReferenceData({
  vendors,
  parts,
  projects,
  addVendor,
  renameVendor,
  deleteVendor,
  addPart,
  renamePart,
  deletePart,
  addProject,
  renameProject,
  deleteProject,
  showToast,
  askConfirm
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3 className="text-[15.5px] font-semibold">Vendors, Parts &amp; Projects</h3>
        <div className="text-[11.5px] text-ink-faint">These also grow automatically as new values are used on transactions</div>
      </div>
      <div className="panel-body grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ListBlock title="Vendors" items={vendors} onAdd={addVendor} onRename={renameVendor} onDelete={deleteVendor} showToast={showToast} askConfirm={askConfirm} />
        <ListBlock title="Parts" items={parts} onAdd={addPart} onRename={renamePart} onDelete={deletePart} showToast={showToast} askConfirm={askConfirm} />
        <ListBlock title="Projects" items={projects} onAdd={addProject} onRename={renameProject} onDelete={deleteProject} showToast={showToast} askConfirm={askConfirm} />
      </div>
    </div>
  );
}

function ListBlock({ title, items, onAdd, onRename, onDelete, showToast, askConfirm }) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editVal, setEditVal] = useState("");
  const singular = title.slice(0, -1).toLowerCase();

  async function add() {
    if (!val.trim()) return;
    setBusy(true);
    try {
      await onAdd(val.trim());
      setVal("");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item) {
    setEditingItem(item);
    setEditVal(item);
  }

  async function confirmEdit() {
    const newName = editVal.trim();
    if (!newName || newName === editingItem) {
      setEditingItem(null);
      return;
    }
    try {
      await onRename(editingItem, newName);
      setEditingItem(null);
    } catch (e) {
      showToast(e.message || "Rename failed.", true);
    }
  }

  function handleDelete(item) {
    askConfirm(`Delete ${singular} "${item}"? This only works if it isn't used in any transaction.`, async () => {
      try {
        await onDelete(item);
      } catch (e) {
        showToast(e.message || "Delete failed.", true);
      }
    });
  }

  return (
    <div>
      <div className="text-[12px] font-bold uppercase tracking-wide text-ink-soft mb-2">{title}</div>
      <div className="flex gap-2 mb-2">
        <input className="field-input" placeholder={`New ${title.toLowerCase()}…`} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
        <button className="btn btn-ghost" disabled={busy} onClick={add} style={{ padding: "9px 12px" }}>
          Add
        </button>
      </div>
      <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
        {items.map((i) =>
          editingItem === i ? (
            <div key={i} className="flex gap-1.5">
              <input
                autoFocus
                className="field-input"
                style={{ padding: "6px 8px" }}
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); confirmEdit(); }
                  if (e.key === "Escape") setEditingItem(null);
                }}
              />
              <button className="btn btn-primary" style={{ padding: "6px 10px" }} onClick={confirmEdit}>
                Save
              </button>
              <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => setEditingItem(null)}>
                ✕
              </button>
            </div>
          ) : (
            <div key={i} className="pill flex items-center gap-2 justify-between">
              <span>{i}</span>
              <span className="flex items-center gap-1 shrink-0">
                <button type="button" className="p-0.5 rounded text-ink-soft hover:bg-cream hover:text-ink" title="Rename" onClick={() => startEdit(i)}>
                  <Icon name="edit" size={13} />
                </button>
                <button type="button" className="p-0.5 rounded text-rust hover:bg-rust-bg" title="Delete" onClick={() => handleDelete(i)}>
                  <Icon name="trash" size={13} />
                </button>
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
