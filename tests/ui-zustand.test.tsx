import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { expect, it } from "vitest";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { Select } from "@/components/ui/select";

const options = [
  { value: "production", label: "production" },
  { value: "test", label: "test" },
] as const;

it("controls a selector from Zustand without rerendering for unrelated updates", async () => {
  const store = createStore(() => ({ environment: "production", received: 0 }));
  let renders = 0;
  function EnvironmentControl() {
    const environment = useStore(store, (state) => state.environment);
    renders += 1;
    return (
      <form aria-label="Filters">
        <Select
          name="environment"
          label="Environment"
          value={environment}
          options={options}
          onValueChange={(value) => store.setState({ environment: value })}
        />
      </form>
    );
  }
  render(<EnvironmentControl />);
  const initialRenders = renders;
  act(() => store.setState({ received: 100 }));
  expect(renders).toBe(initialRenders);
  const trigger = screen.getByRole("combobox", { name: "Environment" });
  fireEvent.keyDown(trigger, { key: " " });
  fireEvent.click(await screen.findByRole("option", { name: "test" }));
  await waitFor(() => expect(trigger).toHaveTextContent("test"));
  expect(store.getState().environment).toBe("test");
  expect(
    new FormData(screen.getByRole("form") as HTMLFormElement).get(
      "environment",
    ),
  ).toBe("test");
  act(() => store.setState({ environment: "production" }));
  expect(trigger).toHaveTextContent("production");
});
