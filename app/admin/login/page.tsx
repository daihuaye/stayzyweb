import { AuthPage } from "@/components/admin/auth-page";
import { LoginForm } from "@/components/admin/login-form";
export const metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return (
    <AuthPage
      title="Welcome to your control room."
      description="Sign in with your administrator account to manage Stayzy’s next chapter."
    >
      {notice === "password-changed" && (
        <p
          role="status"
          className="mt-6 rounded-xl bg-[#e1eee6] p-4 text-sm text-primary"
        >
          Your password has changed. Sign in again with your new password.
        </p>
      )}
      {notice === "logout-unconfirmed" && (
        <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm">
          You are signed out on this browser. The backend could not confirm
          session revocation; that session expires within eight hours.
        </p>
      )}
      <LoginForm />
      <p className="mt-7 text-center text-xs text-muted-foreground">
        Secure session · Expires after 8 hours
      </p>
    </AuthPage>
  );
}
