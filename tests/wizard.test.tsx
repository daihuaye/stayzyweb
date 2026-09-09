import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminProvider } from "@/components/admin/provider";
import { Wizard } from "@/components/admin/wizard";
import { createRule, loadRules } from "@/app/admin/actions";
const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/app/admin/actions", () => ({
  createRule: vi.fn(),
  loadRules: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
function mount() {
  render(
    <AdminProvider>
      <Wizard />
    </AdminProvider>,
  );
}
function next() {
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}
function review() {
  fireEvent.change(screen.getByLabelText(/Experiment key/), {
    target: { value: "focus_coach" },
  });
  next();
  next();
}
it("validates steps, preserves drafts going back, creates and navigates", async () => {
  vi.mocked(createRule).mockResolvedValue({
    ok: true,
    data: {
      key: "focus_coach",
      enabled: false,
      rolloutPercentage: 25,
      allocationSalt: "stable",
    },
  });
  mount();
  next();
  expect(screen.getByRole("alert")).toHaveTextContent("1–80");
  fireEvent.change(screen.getByLabelText(/Experiment key/), {
    target: { value: "focus_coach" },
  });
  next();
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Rollout percentage" }),
    { target: { value: "25" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText(/Experiment key/)).toHaveValue("focus_coach");
  next();
  expect(
    screen.getByRole("spinbutton", { name: "Rollout percentage" }),
  ).toHaveValue(25);
  next();
  fireEvent.click(screen.getByRole("button", { name: "Create flight" }));
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/admin"));
  expect(createRule).toHaveBeenCalledWith({
    key: "focus_coach",
    enabled: false,
    rolloutPercentage: 25,
  });
});
it("keeps values after duplicate key and allows correction", async () => {
  vi.mocked(createRule).mockResolvedValue({
    ok: false,
    error: "This key already exists.",
    code: "experiment_exists",
  });
  mount();
  review();
  fireEvent.click(screen.getByRole("button", { name: "Create flight" }));
  await waitFor(() =>
    expect(screen.getByLabelText(/Experiment key/)).toHaveValue("focus_coach"),
  );
  expect(screen.getByText("This key already exists.")).toBeInTheDocument();
});
it("reconciles an uncertain creation and shows saved state without claiming success", async () => {
  vi.mocked(createRule).mockResolvedValue({
    ok: false,
    error: "Connection lost",
    uncertain: true,
  });
  vi.mocked(loadRules).mockResolvedValue({
    ok: true,
    data: {
      schemaVersion: 1,
      rules: {
        focus_coach: {
          enabled: true,
          rolloutPercentage: 20,
          allocationSalt: "stable",
        },
      },
    },
  });
  mount();
  review();
  fireEvent.click(screen.getByRole("button", { name: "Create flight" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Check saved state" }),
  );
  expect(await screen.findByText("Saved configuration")).toBeInTheDocument();
  expect(navigation.push).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Create flight" })).toBeDisabled();
});
it("confirms cancellation", async () => {
  mount();
  fireEvent.change(screen.getByLabelText(/Experiment key/), {
    target: { value: "draft" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(screen.getByLabelText(/Experiment key/)).toHaveValue("draft");
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.click(screen.getByRole("button", { name: "Discard draft" }));
  expect(navigation.push).toHaveBeenCalledWith("/admin");
});
