import { expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { HeroPreview } from "@/components/site/hero-preview";
import { AppTour } from "@/components/site/app-tour";

it("lets visitors choose current native app screens without a moving carousel", () => {
  render(<HeroPreview />);
  const picker = screen.getByRole("group", { name: "Explore app screens" });
  expect(
    within(picker).getByRole("button", { name: "Get ready" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByAltText(/session setup with activities/)).toBeVisible();
  fireEvent.click(within(picker).getByRole("button", { name: "Look back" }));
  expect(
    screen.getByAltText(/History showing a weekly calendar/),
  ).toBeVisible();
  expect(
    within(picker).getByRole("button", { name: "Get ready" }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(
    within(picker).getByRole("button", { name: "Look back" }),
  ).toHaveAttribute("aria-pressed", "true");
});

it("keeps the app tour keyboard accessible with current iPhone and iPad captures", () => {
  render(<AppTour />);
  const first = screen.getByRole("tab", { name: "Stay present" });
  fireEvent.keyDown(first, { key: "End" });
  const history = screen.getByRole("tab", { name: "Look back" });
  expect(history).toHaveFocus();
  expect(history).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveAttribute(
    "aria-labelledby",
    history.id,
  );
  expect(
    screen.getByAltText(/History showing a weekly calendar/),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "Build your rhythm" }));
  expect(screen.getByAltText(/October calendar on iPad/)).toBeVisible();
  expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "tour-panel-2");
});
