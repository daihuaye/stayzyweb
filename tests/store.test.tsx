import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useStore } from "zustand";
import { createAdminStore, dirty } from "@/lib/admin-store";
import { keyError, rolloutError, validConfiguration } from "@/lib/experiments";
const rule = { enabled: false, rolloutPercentage: 0, allocationSalt: "salt" };
describe("isolated normalized state", () => {
  it("does not render another rule when one changes", () => {
    const store = createAdminStore();
    store.getState().merge({ a: rule, b: rule });
    const renders = { a: 0, b: 0 };
    function Control({ id }: { id: "a" | "b" }) {
      const value = useStore(
        store,
        (s) => s.entries[id].draft.rolloutPercentage,
      );
      renders[id]++;
      return (
        <span>
          {id}:{value}
        </span>
      );
    }
    render(
      <>
        <Control id="a" />
        <Control id="b" />
      </>,
    );
    const previous = store.getState().entries.b;
    act(() => store.getState().edit("a", { rolloutPercentage: 25 }));
    expect(screen.getByText("a:25")).toBeInTheDocument();
    expect(renders.b).toBe(1);
    expect(store.getState().entries.b).toBe(previous);
  });
  it("preserves drafts on refresh and discards to latest server state", () => {
    const store = createAdminStore();
    store.getState().merge({ a: rule });
    store.getState().edit("a", { rolloutPercentage: 25 });
    store.getState().merge({ a: { ...rule, rolloutPercentage: 50 } });
    expect(store.getState().entries.a.draft.rolloutPercentage).toBe(25);
    store.getState().discard("a");
    expect(store.getState().entries.a.draft.rolloutPercentage).toBe(50);
    expect(dirty(store.getState().entries.a)).toBe(false);
  });
  it("isolates instances and resets only the wizard after creation", () => {
    const a = createAdminStore(),
      b = createAdminStore();
    a.getState().patchWizard({ key: "focus_coach" });
    expect(b.getState().wizard.key).toBe("");
    a.getState().created("focus_coach", rule);
    expect(a.getState().wizard.key).toBe("");
    expect(a.getState().highlighted).toBe("focus_coach");
    expect(b.getState().entries).toEqual({});
  });
});
it("validates boundaries and public schema", () => {
  for (const key of ["", "Upper", "1key", "key-name", "key\n", "a".repeat(81)])
    expect(keyError(key)).not.toBe("");
  expect(keyError("a".repeat(80))).toBe("");
  for (const n of [-1, 101, 0.5, NaN]) expect(rolloutError(n)).not.toBe("");
  expect(rolloutError(100)).toBe("");
  expect(rolloutError(0)).toBe("");
  expect(validConfiguration({ schemaVersion: 1, rules: { a: rule } })).toBe(
    true,
  );
  expect(validConfiguration({ schemaVersion: 2, rules: { a: rule } })).toBe(
    false,
  );
});

it("accepts prototype-named keys without confusing missing records", () => {
  const store = createAdminStore();
  store.getState().merge({ constructor: rule });
  expect(store.getState().entries["constructor" as string].saved).toEqual(rule);
});
