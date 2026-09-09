import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/current-admin";
import { AuthPage } from "@/components/admin/auth-page";
import { AccessError } from "@/components/admin/access-error";
import { ChangePasswordForm } from "@/components/admin/password-forms";
export const metadata = {
  title: "Change password",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const result = await currentAdmin();
  if (!result.ok) {
    if (result.code === "unauthorized") redirect("/admin/login");
    return <AccessError message={result.error} />;
  }
  return (
    <AuthPage
      title={
        result.data.must_change_password
          ? "Make this account yours."
          : "Choose a new password."
      }
      description={
        result.data.must_change_password
          ? "Replace your temporary password before accessing flights or account management."
          : "Update your password and sign out existing sessions."
      }
    >
      <p className="mt-5 break-all text-sm text-primary">{result.data.email}</p>
      <ChangePasswordForm email={result.data.email} />
    </AuthPage>
  );
}
