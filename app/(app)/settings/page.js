"use client";
import { useEffect, useState } from "react";
import { useAppData } from "@/components/DataProvider";
import SelectWithAdd from "@/components/SelectWithAdd";

export default function SettingsPage() {
  const { user, showToast, vendors, parts, projects, addVendor, addPart, addProject } = useAppData();
  const isAdmin = user.role === "Admin";

  return (
    <>
      <ChangePassword showToast={showToast} />
      {isAdmin && <ManageUsers showToast={showToast} />}
      {isAdmin && <ManageReferenceData vendors={vendors} parts={parts} projects={projects} addVendor={addVendor} addPart={addPart} addProject={addProject} />}
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

function ManageReferenceData({ vendors, parts, projects, addVendor, addPart, addProject }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3 className="text-[15.5px] font-semibold">Vendors, Parts &amp; Projects</h3>
        <div className="text-[11.5px] text-ink-faint">These also grow automatically as new values are used on transactions</div>
      </div>
      <div className="panel-body grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ListBlock title="Vendors" items={vendors} onAdd={addVendor} />
        <ListBlock title="Parts" items={parts} onAdd={addPart} />
        <ListBlock title="Projects" items={projects} onAdd={addProject} />
      </div>
    </div>
  );
}

function ListBlock({ title, items, onAdd }) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
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
  return (
    <div>
      <div className="text-[12px] font-bold uppercase tracking-wide text-ink-soft mb-2">{title}</div>
      <div className="flex gap-2 mb-2">
        <input className="field-input" placeholder={`New ${title.toLowerCase()}…`} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
        <button className="btn btn-ghost" disabled={busy} onClick={add} style={{ padding: "9px 12px" }}>
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
        {items.map((i) => (
          <span key={i} className="pill">
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
