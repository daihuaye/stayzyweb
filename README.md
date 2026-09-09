# Stayzy web

Responsive Stayzy introduction and feature-flight administration, built with Next.js App Router, Tailwind CSS, shadcn-style Radix primitives, Lucide, and Zustand.

## Run locally

```sh
pnpm install
cp .env.example .env.local
# Configure STAYZY_API_BASE_URL and a random STAYZY_SESSION_SECRET (32+ characters).
pnpm dev
```

Open `/` for the public site, `/admin/login` to sign in, and `/admin` for flights. Sign in using the backend's `STAYZY_EXPERIMENT_ADMIN_TOKEN`; it is never a public environment variable. `STAYZY_API_BASE_URL` is the API origin without `/v1` and must use HTTPS in production. Set `STAYZY_APP_STORE_URL` to an HTTPS `apps.apple.com` URL to enable download links.

Sessions contain an encrypted admin token in an eight-hour HttpOnly, SameSite=Strict cookie, Secure in production. Rotate the session secret to invalidate sessions. API requests execute server-side with no caching; Server Actions enforce same-origin mutations and validate authorization individually. No credentials or drafts go into local storage. Production hosting must support Next.js server execution; this is not a static export.

## Flight lifecycle

Create a flight at `/admin/experiments/new`: identify its permanent lowercase key, configure status and integer percentage, and review. The API generates an immutable allocation salt. New flights default to disabled and 0%. Saved edits are explicit, drafts survive refresh, and uncertain writes require checking saved state before retrying.

Deploy the backend implementation of `POST /v1/admin/experiments` before using creation. Older APIs produce a clear unavailable message without clearing drafts. The existing public GET schema stays at version 1. No database migration is required. Each new feature must register and check its key in an app release; unknown keys are ignored by existing clients. Stable allocation uses the installation ID, experiment key, and salt. App refresh timing and saved session snapshots mean existing sessions do not instantly change.

## Structure

Shared primitives live in `components/ui`, compositions in `components/site` and `components/admin`. Styling comes from semantic Tailwind tokens in `app/globals.css`. Reuse typed props/children instead of duplicating mobile and desktop components. `components.json` records the shadcn configuration.

The admin provider owns one Zustand vanilla store per mounted application. Rule entries are normalized by key, unchanged references are preserved, and components subscribe through narrow selectors. The wizard is a separate slice. Server requests never share a global mutable store.

## Verification

```sh
pnpm test
pnpm lint
pnpm build
```

If a restricted environment blocks Turbopack worker ports, use `pnpm exec next build --webpack`. The webpack production build is verified.

Tests use mocked server actions and isolated stores, never live rollout mutations. Backend experiment tests run in the sibling API repository with its test environment. Browser verification covers 360px, 768px, and 1440px layouts. There is no automatic deployment.
