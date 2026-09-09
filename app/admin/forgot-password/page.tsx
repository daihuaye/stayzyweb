import { AuthPage } from "@/components/admin/auth-page";
import { ForgotPasswordForm } from "@/components/admin/password-forms";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Recover account",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function Page() {
  return (
    <AuthPage
      title="Let’s get you back in."
      description="Request a reset link for your administrator account. You don’t need to share your password with anyone."
    >
      <ForgotPasswordForm />
    </AuthPage>
  );
}
