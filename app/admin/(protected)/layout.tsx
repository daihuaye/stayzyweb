import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { openSession, sessionCookie } from "@/lib/session";
import { AdminProvider } from "@/components/admin/provider";
import { AdminShell } from "@/components/admin/shell";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await openSession((await cookies()).get(sessionCookie)?.value);
  if (!token) redirect("/admin/login");
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
