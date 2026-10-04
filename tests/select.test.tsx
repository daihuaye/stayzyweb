import { expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Select } from "@/components/ui/select";

it("submits the original empty and selected filter values", async () => {
  const { container } = render(
    <form>
      <Select
        label="Version"
        name="version"
        options={[
          { value: "", label: "All versions" },
          { value: "1.2", label: "1.2" },
        ]}
      />
    </form>,
  );
  const form = container.querySelector("form")!;
  expect(new FormData(form).get("version")).toBe("");
  const trigger = screen.getByRole("combobox", { name: "Version" });
  fireEvent.keyDown(trigger, { key: " " });
  fireEvent.click(await screen.findByRole("option", { name: "1.2" }));
  await waitFor(() => expect(trigger).toHaveTextContent("1.2"));
  expect(new FormData(form).get("version")).toBe("1.2");
  fireEvent.keyDown(trigger, { key: " " });
  fireEvent.click(await screen.findByRole("option", { name: "All versions" }));
  expect(new FormData(form).get("version")).toBe("");
});

it("opens with the keyboard and dismisses without changing the value", async () => {
  render(
    <Select
      name="environment"
      label="Environment"
      defaultValue="production"
      options={[
        { value: "production", label: "production" },
        { value: "test", label: "test" },
      ]}
    />,
  );
  const trigger = screen.getByRole("combobox", { name: "Environment" });
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  const selected = await screen.findByRole("option", { name: "production" });
  expect(selected).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(selected, { key: "Escape" });
  await waitFor(() =>
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
  );
  expect(trigger).toHaveTextContent("production");
});
