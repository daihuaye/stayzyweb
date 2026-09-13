# Telemetry dashboard

Open **Telemetry** in the admin sidebar (`/admin/telemetry`). Both administrator and owner accounts can read the dashboard.

- **Overview**: usage, session outcomes, start funnels, recorded waiting time, and delivery coverage.
- **Sessions**: filter and inspect session UUIDs across continuation and app restarts. Session details include timelines, original configuration and changes, recognition epochs, snapshot completeness, and the paginated event log.
- **Detection Health**: camera startup, processing latency, error reasons, recoveries, and buddy attribution coverage.

The default is the last seven days, production traffic, UTC. Filters are stored in the URL. Refresh is manual; tab switches and pagination reuse the receipt cutoff. Missing measurements are unavailable, not zero. Possible drop-off means an unfinished session without activity or delivery for 24 hours, excluding explicit manual breaks; it is not confirmed abandonment or a crash.

## Setup

Deploy stayzyapi's reporting endpoints and run its `0009_telemetry_reporting` migration before deploying this UI. Existing `STAYZY_API_BASE_URL` and `STAYZY_SESSION_SECRET` settings are reused; production API URLs must use HTTPS. Tokens remain in server-side API calls. No new app instrumentation or collection controls are introduced.

The backend repository's `docs/TELEMETRY_DASHBOARD.md` documents endpoints, metric definitions, pagination, retention, validation, and deployment order. Missing reporting endpoints produce a deployment/setup error in the UI.

## Development checks

```sh
pnpm test
pnpm lint
pnpm build
```

The dashboard uses existing Tailwind components and SVG charts with data-table alternatives. No chart dependency or background polling is added. All screenshots used for development verification should contain synthetic telemetry only.
