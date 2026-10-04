# Stayzy UI

Use these components instead of creating another button, report surface, or selector. The foundation is shadcn/ui with Radix primitives, customized for Stayzy. Card, Badge, and Skeleton come from the official shadcn registry; existing controls retain their established public APIs. Attribution is in `THIRD_PARTY_NOTICES.md`.

## Shared patterns

- `Button`: `default`, `outline`, `secondary`, `ghost`, `dark`, `destructive`; sizes `default`, `sm`, `lg`, `icon`. Icon buttons require an accessible name. All sizes retain a 44px touch target. Use `asChild` for navigation links.
- `Input`: native form attributes, ref, disabled and invalid states. Pair it with a visible label; use `aria-describedby` for help and errors.
- `Select`: icon-led Radix menu, keyboard navigation, option descriptions, and original native form values, including the empty “all” choice. Use `value` and `onValueChange` for controlled state, or `defaultValue` for a local form draft. Hoist static options outside components.
- `Card`: compose `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardAction`, and `CardFooter`. `asChild` on Card and CardTitle preserves semantic sections and headings.
- `Badge`: status or environment labels, including `subtle`, `secondary`, and `outline`. It is informational unless explicitly composed with a link.
- `Skeleton`: decorative loading shape. Its parent must announce loading with `role="status"`; mark the report region `aria-busy` when appropriate.

Keep teal selection colors and inherited semantic theme variables. Shared shape tokens live in `app/globals.css`: pill controls, 12px fields and surfaces, 16px menus. Motion respects reduced-motion preferences. Import individual files rather than a client barrel so noninteractive components remain usable on the server.

## Zustand integration

The UI components do not own a global store. Subscribe only where a value is displayed or edited, using a stable primitive selector. Existing admin and telemetry stores remain scoped to their providers and report snapshots.

```tsx
const environment = useStore(store, (state) => state.environment);
const setEnvironment = useStore(store, (state) => state.setEnvironment);

return (
  <Select
    name="environment"
    label="Environment"
    options={environmentOptions}
    value={environment}
    onValueChange={setEnvironment}
  />
);
```

Avoid subscribing to the whole store. When selecting several values into a new object or array, use Zustand's `useShallow`. Keep transient menu-open, hover, and focus state local to Radix or the component. Telemetry caches reports per query and deduplicates concurrent requests; changing a filter commits a new report snapshot.

## Extending the foundation

`components.json` configures the existing shadcn registry. Add needed components with `pnpm dlx shadcn@latest add <component>`, inspect the generated imports, reuse `@/lib/utils` and the installed individual Radix packages, and adapt theme variables before use. Do not overwrite customized wrappers blindly. Verify keyboard interaction, mobile sizing, light/dark contrast, and any controlled-state behavior changed by the addition.
