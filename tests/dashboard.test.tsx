import { beforeEach, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { AdminProvider } from "@/components/admin/provider";
import { Dashboard } from "@/components/admin/dashboard";
import { loadRules, saveRule } from "@/app/admin/actions";
const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/app/admin/actions", () => ({
  loadRules: vi.fn(),
  saveRule: vi.fn(),
}));
const rule = { enabled: true, rolloutPercentage: 50, allocationSalt: "stable" };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadRules).mockResolvedValue({
    ok: true,
    data: { schemaVersion: 1, rules: { companion: rule } },
  });
});
async function mount() {
  render(
    <AdminProvider>
      <Dashboard />
    </AdminProvider>,
  );
  await screen.findByRole("heading", { name: "companion" });
  return within(screen.getByRole("article"));
}
it("saves only explicitly and preserves drafts during refresh", async () => {
  const card = await mount();
  fireEvent.change(card.getByRole("spinbutton"), { target: { value: "25" } });
  expect(saveRule).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Refresh" })).not.toBeDisabled(),
  );
  expect(card.getByRole("spinbutton")).toHaveValue(25);
  vi.mocked(saveRule).mockResolvedValue({
    ok: true,
    data: { ...rule, rolloutPercentage: 25 },
  });
  fireEvent.click(card.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "companion has been saved",
  );
  expect(saveRule).toHaveBeenCalledWith("companion", {
    enabled: true,
    rolloutPercentage: 25,
  });
  expect(card.getByRole("button", { name: "Save changes" })).toBeDisabled();
});
it("requires reconciliation after uncertain saves", async () => {
  vi.mocked(saveRule).mockResolvedValue({
    ok: false,
    error: "Connection lost",
    uncertain: true,
  });
  const card = await mount();
  fireEvent.change(card.getByRole("spinbutton"), { target: { value: "10" } });
  fireEvent.click(card.getByRole("button", { name: "Save changes" }));
  const check = await screen.findByRole("button", {
    name: "Check saved state",
  });
  expect(card.getByRole("spinbutton")).toBeDisabled();
  fireEvent.click(check);
  expect(
    await screen.findByText(/Saved configuration checked/),
  ).toBeInTheDocument();
  expect(card.getByRole("spinbutton")).toHaveValue(10);
  expect(card.getByRole("button", { name: "Save changes" })).not.toBeDisabled();
});
