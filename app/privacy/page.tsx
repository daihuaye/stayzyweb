import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/site/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Stayzy handles camera processing, local data, optional analytics, purchases, and your privacy choices.",
  openGraph: {
    title: "Privacy Policy · Stayzy",
    description: "Understand your data and privacy choices in Stayzy.",
    type: "website",
  },
};

const sections = [
  {
    id: "camera",
    title: "Camera and Time by buddy",
    paragraphs: [
      "Stayzy requests access to the front camera to estimate presence during focus sessions. Camera images are analyzed on your device and are not recorded or uploaded. Stayzy does not record microphone audio.",
      "Optional Time by buddy matches faces on your device after you confirm that everyone in view agrees. Face templates are held in memory for the live session and cleared when the session ends or the app process terminates. They are not saved or uploaded. Matching is approximate and can assign time to the wrong buddy. Stayzy measures presence, not concentration or secure identity.",
    ],
  },
  {
    id: "local-data",
    title: "Information on your device",
    paragraphs: [
      "Local profiles, task settings, buddy names, session history, and preferences are stored on your device. Saved buddy reports contain labels, visits, and timing information, not face templates.",
      "Removing local app data does not automatically delete information already received by Stayzy’s server or records held by Apple.",
    ],
  },
  {
    id: "analytics",
    title: "Usage and diagnostics",
    paragraphs: [
      "Usage and diagnostic sharing is enabled by default. You can turn it off in Settings → Privacy Detail & Settings. Shared events include app interactions, session timings and sanitized timelines, camera performance and failure codes, app and operating-system versions, device class, feature settings, and random installation, session, and buddy identifiers.",
      "These events exclude profile and buddy names, custom task text, camera images, face templates, landmarks, and audio. Events are associated through a random installation identifier. Although they do not include your real-world name or a Stayzy account, the identifier links events from the same installation. This is not cross-company advertising tracking.",
      "Turning sharing off clears pending events and analytics metadata and stops collection and delivery. Turning it back on generates a new installation identifier. Turning sharing off does not retroactively erase events already received by the server.",
    ],
  },
  {
    id: "purchases",
    title: "Purchases and downloads",
    paragraphs: [
      "Apple handles purchase confirmation and payment. Stayzy receives signed transaction information and verifies it with its server to provide trial, purchased, or family-shared access and authorized voice downloads. Stayzy does not receive your payment-card details through this process.",
      "Server records include product and transaction identifiers, ownership, purchase environment, purchase and expiry dates, revocation information, and an access-grant identifier. These records associate purchases with access rights, even though you do not need a Stayzy customer account.",
    ],
  },
  {
    id: "retention",
    title: "Retention and privacy requests",
    paragraphs: [
      "Local information remains in the app’s storage until you remove it. Server-side analytics, purchase records, and operational logs are separate from local app data. Purchase records support access verification, restoration, Family Sharing, and revocation handling.",
      "Contact us using the address below to ask about server-data retention or request deletion. Turning off analytics or deleting the app does not itself submit a server-data deletion request. Apple manages its own purchase records and privacy requests separately.",
    ],
  },
  {
    id: "choices",
    title: "Your privacy controls",
    paragraphs: [
      "You can change camera permission in iOS Settings, turn off Time by buddy before a session, disable usage sharing, and manage local profiles and history in Stayzy. Apple manages App Store payments, refunds, and Family Sharing.",
      "When contacting support, include only information needed to explain the issue, such as your app version and device model. Do not send passwords, camera images, face data, or Apple purchase proofs. We receive the email address and information you choose to include in your message so we can respond.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <a
        href="#policy"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-10 focus:rounded-lg focus:bg-card focus:p-3 focus:text-primary"
      >
        Skip to privacy policy
      </a>
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-7 lg:px-12">
        <Brand />
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Back to home
        </Link>
      </header>
      <main id="policy" className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:pt-16">
        <p className="eyebrow text-primary">Your data, your choices</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Privacy policy
        </h1>
        <p className="mt-5 text-sm text-muted-foreground">
          Last updated <time dateTime="2026-09-12">September 12, 2026</time>
        </p>
        <p className="mt-8 text-lg leading-8">
          Stayzy helps you track presence during focus sessions. You do not need
          a Stayzy customer account. This policy covers the Stayzy iPhone and
          iPad app and app support; it does not describe the separate
          administrator portal.
        </p>
        <nav
          aria-label="Privacy policy sections"
          className="my-10 border-y border-border py-5"
        >
          <p className="mb-2 text-sm font-semibold">On this page</p>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {sections.map(({ id, title }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex min-h-11 items-center rounded-sm text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {title}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                className="inline-flex min-h-11 items-center rounded-sm text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Contact and updates
              </a>
            </li>
          </ul>
        </nav>
        <div className="space-y-10">
          {sections.map(({ id, title, paragraphs }) => (
            <section
              key={id}
              id={id}
              aria-labelledby={`${id}-heading`}
              className="scroll-mt-8"
            >
              <h2
                id={`${id}-heading`}
                className="text-2xl font-semibold tracking-tight"
              >
                {title}
              </h2>
              {paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-7">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
          <section
            id="contact"
            aria-labelledby="contact-heading"
            className="scroll-mt-8 border-t border-border pt-8"
          >
            <h2
              id="contact-heading"
              className="text-2xl font-semibold tracking-tight"
            >
              Contact and updates
            </h2>
            <p className="mt-4 leading-7">
              For Stayzy support or privacy questions, email{" "}
              <a
                href="mailto:daye@vistasolutionsllc.com"
                className="break-words rounded-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                daye@vistasolutionsllc.com
              </a>
              .
            </p>
            <p className="mt-4 leading-7">
              We update this page when Stayzy’s data practices change. The date
              above identifies the latest revision.
            </p>
          </section>
        </div>
      </main>
      <footer className="mx-auto max-w-7xl border-t border-border px-6 py-8 lg:px-12">
        <Brand className="text-xl" />
      </footer>
    </>
  );
}
