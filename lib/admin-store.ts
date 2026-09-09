import { createStore } from "zustand/vanilla";
import type { NewRule, Rule, RuleInput } from "./experiments";
export type Entry = {
  saved: Rule;
  draft: RuleInput;
  pending: boolean;
  error: string;
  uncertain: boolean;
};
export type Wizard = NewRule & {
  step: number;
  pending: boolean;
  error: string;
  uncertain: boolean;
  existing: Rule | null;
};
const newWizard = (): Wizard => ({
  key: "",
  enabled: false,
  rolloutPercentage: 0,
  step: 0,
  pending: false,
  error: "",
  uncertain: false,
  existing: null,
});
export function dirty(entry: Entry) {
  return (
    entry.draft.enabled !== entry.saved.enabled ||
    entry.draft.rolloutPercentage !== entry.saved.rolloutPercentage
  );
}
export type AdminState = {
  entries: Record<string, Entry>;
  wizard: Wizard;
  notice: string;
  highlighted: string | null;
  merge: (rules: Record<string, Rule>) => void;
  edit: (key: string, patch: Partial<RuleInput>) => void;
  patchEntry: (key: string, patch: Partial<Entry>) => void;
  discard: (key: string) => void;
  saved: (key: string, rule: Rule) => void;
  patchWizard: (patch: Partial<Wizard>) => void;
  resetWizard: () => void;
  created: (key: string, rule: Rule) => void;
  setNotice: (notice: string) => void;
};
export const createAdminStore = () =>
  createStore<AdminState>((set) => ({
    entries: {},
    wizard: newWizard(),
    notice: "",
    highlighted: null,
    merge: (rules) =>
      set((state) => {
        const entries: Record<string, Entry> = {};
        for (const [key, rule] of Object.entries(rules)) {
          const previous = Object.hasOwn(state.entries, key)
            ? state.entries[key]
            : undefined;
          if (
            previous &&
            JSON.stringify(previous.saved) === JSON.stringify(rule)
          )
            entries[key] = previous;
          else
            entries[key] = {
              saved: rule,
              draft:
                previous && dirty(previous)
                  ? previous.draft
                  : {
                      enabled: rule.enabled,
                      rolloutPercentage: rule.rolloutPercentage,
                    },
              pending: previous?.pending ?? false,
              error: previous?.error ?? "",
              uncertain: previous?.uncertain ?? false,
            };
        }
        return { entries };
      }),
    edit: (key, patch) =>
      set((state) => ({
        entries: {
          ...state.entries,
          [key]: {
            ...state.entries[key],
            draft: { ...state.entries[key].draft, ...patch },
            error: "",
          },
        },
      })),
    patchEntry: (key, patch) =>
      set((state) => ({
        entries: {
          ...state.entries,
          [key]: { ...state.entries[key], ...patch },
        },
      })),
    discard: (key) =>
      set((state) => ({
        entries: {
          ...state.entries,
          [key]: {
            ...state.entries[key],
            draft: {
              enabled: state.entries[key].saved.enabled,
              rolloutPercentage: state.entries[key].saved.rolloutPercentage,
            },
            error: "",
          },
        },
      })),
    saved: (key, rule) =>
      set((state) => ({
        entries: {
          ...state.entries,
          [key]: {
            saved: rule,
            draft: {
              enabled: rule.enabled,
              rolloutPercentage: rule.rolloutPercentage,
            },
            error: "",
            pending: false,
            uncertain: false,
          },
        },
        notice: `${key} has been saved.`,
      })),
    patchWizard: (patch) =>
      set((state) => ({ wizard: { ...state.wizard, ...patch } })),
    resetWizard: () => set({ wizard: newWizard() }),
    created: (key, rule) =>
      set((state) => ({
        entries: {
          ...state.entries,
          [key]: {
            saved: rule,
            draft: {
              enabled: rule.enabled,
              rolloutPercentage: rule.rolloutPercentage,
            },
            error: "",
            pending: false,
            uncertain: false,
          },
        },
        wizard: newWizard(),
        highlighted: key,
        notice: `${key} was created successfully.`,
      })),
    setNotice: (notice) => set({ notice }),
  }));
