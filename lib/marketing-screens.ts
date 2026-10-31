// Native release-preparation captures. Source dates and hashes are in
// docs/marketing-screenshot-sources.json. Never synthesize product screenshots.
export const marketingScreens = {
  setup: {
    src: "/marketing/ios-2026-10/setup.png",
    alt: "Stayzy session setup with activities, duration, buddy choices, and the Start Piano Practice button",
    width: 1320,
    height: 2868,
  },
  focus: {
    src: "/marketing/ios-2026-10/piano-focus.png",
    alt: "Piano Practice with Sunny, a keyboard animation, and separate present, away, piano, and elapsed counters",
    width: 1320,
    height: 2868,
  },
  details: {
    src: "/marketing/ios-2026-10/session-details.png",
    alt: "Completed Piano Practice session details showing the goal and a breakdown of present, away, break, and elapsed time",
    width: 1320,
    height: 2868,
  },
  history: {
    src: "/marketing/ios-2026-10/history.png",
    alt: "Stayzy History showing a weekly calendar, daily focus time, sessions, and goals achieved",
    width: 1320,
    height: 2868,
  },
  calendar: {
    src: "/marketing/ios-2026-10/calendar.png",
    alt: "Stayzy’s October calendar on iPad, with progress rings and stars for days with a goal achieved",
    width: 2064,
    height: 2752,
  },
  companion: {
    src: "/marketing/ios-2026-10/companion.png",
    alt: "Stayzy’s full-screen companion during a focus session",
    width: 1320,
    height: 2868,
  },
} as const;
