import { beforeEach, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Accounts } from "@/components/admin/accounts";
import { AdminProvider } from "@/components/admin/provider";
import {
  createAccountAction,
  listAccounts,
  updateAccount,
} from "@/app/admin/auth-actions";
vi.mock("@/app/admin/auth-actions", () => ({
  listAccounts: vi.fn(),
  createAccountAction: vi.fn(),
  updateAccount: vi.fn(),
}));
const owner = {
  id: "owner",
  email: "owner@example.com",
  role: "owner" as const,
  active: true,
  must_change_password: false,
  created_at: "2026-01-01",
};
const admin = {
  ...owner,
  id: "admin",
  email: "admin@example.com",
  role: "admin" as const,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listAccounts).mockResolvedValue({ ok: true, data: [owner, admin] });
});
async function mount() {
  render(
    <AdminProvider>
      <Accounts selfId="owner" />
    </AdminProvider>,
  );
  await screen.findByRole("heading", { name: /owner@example.com/ });
}
it("creates accounts with temporary passwords and clears the form after success", async () => {
  vi.mocked(createAccountAction).mockResolvedValue({
    error: "",
    success: "Administrator created.",
  });
  await mount();
  fireEvent.click(screen.getByRole("button", { name: "Add administrator" }));
  const dialog = within(screen.getByRole("dialog"));
  fireEvent.change(dialog.getByLabelText("Email address"), {
    target: { value: "new@example.com" },
  });
  fireEvent.change(dialog.getByLabelText("Temporary password"), {
    target: { value: "temporary password 123" },
  });
  fireEvent.click(dialog.getByRole("button", { name: "Create administrator" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Administrator created.",
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    vi.mocked(createAccountAction).mock.calls[0][1].get("temporary_password"),
  ).toBe("temporary password 123");
});
it("disables self changes and confirms deactivation with correct consequences", async () => {
  vi.mocked(updateAccount).mockResolvedValue({
    ok: true,
    data: { ...admin, active: false },
  });
  await mount();
  expect(
    screen.getByRole("combobox", { name: "Role for owner@example.com" }),
  ).toBeDisabled();
  const card = within(
    screen
      .getByRole("heading", { name: "admin@example.com" })
      .closest("article")!,
  );
  fireEvent.click(card.getByRole("button", { name: "Deactivate" }));
  const confirmation = within(screen.getByRole("alertdialog"));
  expect(
    confirmation.getByText(/immediately revokes all sessions/),
  ).toBeInTheDocument();
  fireEvent.click(confirmation.getByRole("button", { name: "Confirm change" }));
  await waitFor(() =>
    expect(updateAccount).toHaveBeenCalledWith("admin", { active: false }),
  );
});
