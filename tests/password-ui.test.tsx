import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  ResetPasswordForm,
  ChangePasswordForm,
  ForgotPasswordForm,
} from "@/components/admin/password-forms";
import { LoginForm } from "@/components/admin/login-form";
import { resetPasswordAction } from "@/app/admin/auth-actions";
vi.mock("@/app/admin/auth-actions", () => ({
  loginAction: vi.fn(async () => ({ error: "" })),
  changePasswordAction: vi.fn(async () => ({ error: "" })),
  forgotPasswordAction: vi.fn(async () => ({
    error: "",
    success: "If an active administrator account matches…",
  })),
  resetPasswordAction: vi.fn(async () => ({ error: "Try again" })),
  logoutAction: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  history.replaceState(null, "", "/admin/reset-password");
});
it("uses password manager attributes and reveals passwords only on request", () => {
  render(<LoginForm />);
  expect(screen.getByLabelText("Email address")).toHaveAttribute(
    "autocomplete",
    "username",
  );
  const password = screen.getByLabelText("Password");
  expect(password).toHaveAttribute("autocomplete", "current-password");
  expect(password).toHaveAttribute("type", "password");
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(password).toHaveAttribute("type", "text");
  expect(
    screen.getByRole("link", { name: "Forgot password?" }),
  ).toHaveAttribute("href", "/admin/forgot-password");
});
it("removes fragment without consuming reset token and preserves it on retry", async () => {
  history.replaceState(null, "", "/admin/reset-password#token=private-reset");
  render(<ResetPasswordForm />);
  expect(location.hash).toBe("");
  expect(resetPasswordAction).not.toHaveBeenCalled();
  for (let attempt = 0; attempt < 2; attempt++) {
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "new password 12345" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "new password 12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    await waitFor(() =>
      expect(resetPasswordAction).toHaveBeenCalledTimes(attempt + 1),
    );
    expect(
      vi.mocked(resetPasswordAction).mock.calls[attempt][1].get("reset_token"),
    ).toBe("private-reset");
    await screen.findByText("Try again");
  }
});
it("supports required password changes and generic recovery messages", async () => {
  const view = render(<ChangePasswordForm email="owner@example.com" />);
  expect(screen.getByLabelText("Current password")).toHaveAttribute(
    "autocomplete",
    "current-password",
  );
  expect(screen.getByLabelText("New password")).toHaveAttribute(
    "autocomplete",
    "new-password",
  );
  view.unmount();
  render(<ForgotPasswordForm />);
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "unknown@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Request reset link" }));
  expect(await screen.findByRole("status")).toHaveTextContent("If an active");
});
