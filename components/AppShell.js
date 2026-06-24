"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "./Icon";
import { useAppData } from "./DataProvider";
import { Toast, ConfirmDialog } from "./Overlays";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/transactions", label: "Transactions", icon: "transactions" },
  { href: "/inventory", label: "Inventory", icon: "inventory" },
  { href: "/vendors", label: "Vendor Performance", icon: "vendors" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/settings", label: "Settings", icon: "settings" }
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, projects, projectFilter, setProjectFilter, search, setSearch, refresh, showToast } = useAppData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && <div className="fixed inset-0 bg-black/35 z-[39] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div
        className={`w-[218px] bg-forest-dark text-[#efe9d8] flex-shrink-0 flex flex-col fixed top-0 left-0 h-screen z-40 transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="px-5 pt-5.5 pb-4 border-b border-white/10">
          <div className="font-display text-[19px] font-bold leading-tight text-white">Shivkripa</div>
          <div className="text-[10.5px] tracking-widest uppercase text-[#b7c9bb] mt-1">Job Work Tracker</div>
        </div>
        <div className="flex-1 p-2.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium mb-0.5 ${
                  active ? "bg-white/15 text-white" : "text-[#d7dfd4] hover:bg-white/[0.07]"
                }`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="px-4 py-3.5 border-t border-white/10 text-[12px] text-[#a9bbac]">
          Signed in as <b className="text-white">{user.name}</b>
          <br />
          {user.role}
        </div>
      </div>

      <div className="flex-1 lg:ml-[218px] min-h-screen flex flex-col min-w-0">
        <div className="bg-paper border-b border-rule px-4 sm:px-6 py-3 flex items-center gap-2.5 sm:gap-3.5 flex-wrap sticky top-0 z-20">
          <button className="lg:hidden p-1.5" onClick={() => setSidebarOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="flex items-center gap-1.5 bg-cream border border-rule rounded-lg px-2.5 py-1.5 min-w-[140px] flex-1 sm:flex-initial sm:min-w-[200px]">
            <Icon name="search" className="text-ink-faint" />
            <input
              className="bg-transparent outline-none w-full text-[13.5px]"
              placeholder="Search challan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="px-2.5 py-1.5 border border-rule rounded-lg bg-paper text-[13px] max-w-[140px] sm:max-w-none" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost"
            style={{ padding: "7px 10px", fontSize: 12 }}
            onClick={async () => {
              await refresh();
              showToast("Dashboard refreshed.");
            }}
          >
            <Icon name="refresh" size={14} /> <span className="hidden sm:inline">Refresh</span>
          </button>
          <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2.5 justify-between sm:justify-end order-last sm:order-none">
            <div className="flex items-center gap-2 text-[12.5px] sm:text-[13px] px-2.5 py-1.5 rounded-full bg-ochre-bg text-ochre font-semibold truncate">
              {user.name} · {user.role}
            </div>
            <button onClick={handleLogout} className="p-1 rounded-md text-ink-soft hover:bg-cream hover:text-ink flex-shrink-0" title="Log out">
              <Icon name="logout" />
            </button>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-5 sm:py-5.5 pb-16 max-w-[1360px] w-full min-w-0">{children}</div>
      </div>

      <Toast />
      <ConfirmDialog />
    </div>
  );
}
