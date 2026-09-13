# Stayzy web

Responsive Stayzy introduction and feature-flight administration using Next.js,
Tailwind CSS, shadcn-style Radix primitives, Lucide, and Zustand.

## Local setup

```sh
pnpm install
cp .env.example .env.local
# Set STAYZY_API_BASE_URL and a random STAYZY_SESSION_SECRET (32+ characters).
pnpm dev
```

`STAYZY_API_BASE_URL` is the backend origin without `/v1`; use HTTPS in production.
`STAYZY_SESSION_SECRET` encrypts website cookies and is **not** a login password.
Configure both on **Vercel**, or in this repository's `.env.local` for local use.
`STAYZY_APP_STORE_URL` optionally enables the landing page's App Store links.

## Administrator login and account setup

Sign in at `/admin/login` with an administrator **email and password**. Shared-token
login is removed. Accounts are separate from iOS customer accounts.

Deploy the sibling `stayzyapi` administrator migration (`alembic upgrade head`),
then run `python -m app.jobs.admin_accounts bootstrap-owner` in an interactive
terminal inside the intended backend environment. Prompts collect the first owner's email
and hide the temporary password while it is entered. No account is created automatically.
A local database account does not create a Railway account.

On first login, change the temporary password before accessing flights. Both
owners and admins manage flights; only owners manage `/admin/accounts`. Account
creation accepts an email, role, and temporary password. Share the password
separately; no invitation email is sent. Emails are immutable in this version.
Owners cannot deactivate/demote themselves, and at least one active owner remains.

For recovery, configure **Railway** with `STAYZY_ADMIN_WEB_URL` (the Vercel website
origin), `STAYZY_SENDGRID_ADMIN_RESET_TEMPLATE_ID`, and the existing SendGrid key
and sender. The template uses `reset_link`, `expires_minutes`, and `subject`.
See `stayzyapi/docs/ADMINISTRATORS.md` for full setup and owner recovery commands.

Coordinate backend and web releases: there is no old-token fallback. Remove the
obsolete backend shared-token setting after cutover. Redeploy Vercel/Railway after
changing their variables; restart `pnpm dev` for local variable changes.

## Sessions and recovery

The backend issues opaque eight-hour sessions and stores only token hashes. The
website encrypts that token in the versioned `stayzy_admin_v2` cookie (HttpOnly,
SameSite=Strict, Secure in production). Cookie expiry matches backend expiry.
Password changes/resets and account deactivation revoke backend sessions.

Password recovery uses single-use, 30-minute email links. The token travels in a
URL fragment, is removed immediately, and remains only in the mounted form's
memory. Refreshing requires reopening the original email link. Opening the link
does not consume it. Resetting signs out existing sessions and requires login.

API calls execute server-side with no caching, per-operation authorization, and
same-origin Server Actions. Credentials/reset tokens never enter Zustand or local
storage. A backend outage is reported separately from invalid credentials. Failed
remote logout clears the local cookie and reports unconfirmed revocation.

## Flights and components

Create flights at `/admin/experiments/new`: identify a permanent lowercase key,
configure status/percentage, and review. The API generates an immutable allocation
salt; new flights default to disabled and 0%. Each feature must register/check its
key in a client release. Unknown keys are ignored by existing clients. Public
configuration stays at schema version 1; active sessions keep their snapshots.

Shared UI primitives live in `components/ui`; compositions live in
`components/admin` and `components/site`. Semantic Tailwind tokens are defined in
`app/globals.css`. Typed props and children support reuse across mobile/desktop.
The provider creates a scoped Zustand store. Flight and non-sensitive account
records preserve unchanged references and use narrow selectors. Password fields
and recovery tokens remain local to their forms.

## Verification

```sh
pnpm test
pnpm lint
pnpm build
```

If a restricted environment blocks Turbopack worker ports, use
`pnpm exec next build --webpack`. Tests mock server calls; backend tests use
isolated databases and mocked email delivery. Production accounts, real emails,
rollout changes, and deployment are never part of the test workflow.

## App privacy policy

`/privacy` is a public, static App Router page linked from the homepage footer.
It uses the confirmed support email and describes the iOS/iPadOS app and support.
It does not import administrator authentication or require backend credentials.

Before using its deployed HTTPS URL in App Store Connect or the iOS app, confirm
legal operator identification, deployed provider/log practices, analytics purge
operation, purchase/log retention periods and privacy-request handling. The page
does not claim an unverified 90-day production purge or a deletion completion SLA.
The administrator portal and website hosting practices need separate review.
No domain is assumed in metadata, and creating this route does not deploy it.
