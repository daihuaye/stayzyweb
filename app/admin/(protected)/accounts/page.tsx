import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/current-admin";
import { Accounts } from "@/components/admin/accounts";
import { AccessError } from "@/components/admin/access-error";
export const metadata = {
  title: "Administrators",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const result = await currentAdmin();
  if (!result.ok) {
    if (result.code === "unauthorized") redirect("/admin/login");
    return <AccessError message={result.error} />;
  }
  if (result.data.must_change_password) redirect("/admin/change-password");
  if (result.data.role !== "owner") redirect("/admin");
  return <Accounts selfId={result.data.id} />;
}
