import { AuthPage } from "@/components/admin/auth-page";
import { ResetPasswordForm } from "@/components/admin/password-forms";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function Page() {
  return (
    <AuthPage
      title="A fresh start."
      description="Choose a new administrator password. The reset link can be used once and expires after 30 minutes."
    >
      <ResetPasswordForm />
    </AuthPage>
  );
}
