import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/serverSession";
import DataProvider from "@/components/DataProvider";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <DataProvider user={user}>
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}
