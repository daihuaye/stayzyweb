"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coffee,
  Eye,
  History,
  Smile,
  CalendarDays,
  Timer,
} from "lucide-react";

const features = [
  {
    label: "Stay present",
    icon: Eye,
    title: "Your work deserves your attention.",
    accent: "Let Stayzy watch the clock.",
    body: "Stayzy tracks the time you’re present while you study. Step away when you need to, then return to the work in front of you.",
    note: "Camera-based presence tracking • Keep Stayzy open during your session",
    image: "piano-focus",
    alt: "Piano practice session with a pink heart companion and present, away, piano, and elapsed counters",
    color: "var(--stage-rose)",
  },
  {
    label: "See your time",
    icon: Timer,
    title: "A clearer picture",
    accent: "of your study time.",
    body: "See time present, time away, and breaks in one live report. Follow your goal progress with less logging by hand.",
    note: "Time present measures detected presence, not attention or work quality.",
    image: "piano-report",
    alt: "Live report showing goal progress and separate time counters",
    color: "var(--stage-teal)",
  },
  {
    label: "Build your rhythm",
    icon: CalendarDays,
    title: "Small moments.",
    accent: "A bigger picture.",
    body: "See your sessions across the month. Daily progress rings and stars for achieved goals help you look back on the time you made for yourself.",
    note: "A star marks a day with at least one goal achieved.",
    image: "calendar",
    alt: "September calendar with daily progress rings and a star marking a completed goal",
    color: "var(--stage-neutral)",
  },
  {
    label: "Meet your companion",
    icon: Smile,
    title: "A little company.",
    accent: "Room to focus.",
    body: "Let your companion take the screen for a calmer study space. Your session details are a tap away whenever you need them.",
    note: "Full-screen companion • Your previous focus time still counts toward your goal",
    image: "heart-companion",
    alt: "Full-screen pink heart companion offering encouragement",
    color: "var(--stage-rose)",
  },
  {
    label: "Look back",
    icon: History,
    title: "Your effort,",
    accent: "all in one place.",
    body: "Review saved sessions and time present. Use your history to find your rhythm and plan your next study block.",
    note: "Saved sessions • A little perspective for what comes next",
    image: "practice-history",
    alt: "Session history with a saved piano practice session",
    color: "var(--stage-teal)",
  },
] as const;

export function AppTour() {
  const [active, setActive] = useState(0);
  const [presence, setPresence] = useState<"present" | "away" | "break">(
    "present",
  );
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const feature = features[active];
  function select(index: number, focus = false) {
    const next = (index + features.length) % features.length;
    setActive(next);
    if (focus) {
      tabs.current[next]?.focus();
      tabs.current[next]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "instant",
      });
    }
  }

  return (
    <section
      id="how-it-works"
      aria-labelledby="tour-heading"
      className="site-container app-tour"
    >
      <div className="tour-heading">
        <h2 id="tour-heading">Find your own focus rhythm.</h2>
        <p>
          Explore five small ways Stayzy helps you settle in, stay present, and
          see your progress.
        </p>
      </div>
      <div
        role="tablist"
        aria-label="Explore Stayzy features"
        className="tour-tabs"
      >
        {features.map(({ label, icon: Icon }, index) => (
          <button
            key={label}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            role="tab"
            id={`tour-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`tour-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={(event) => {
              if (
                !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              select(
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? features.length - 1
                    : active + (event.key === "ArrowRight" ? 1 : -1),
                true,
              );
            }}
            className="tour-tab"
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`tour-panel-${active}`}
        aria-labelledby={`tour-tab-${active}`}
        tabIndex={0}
        className="tour-panel"
      >
        <div className="tour-copy">
          <h3 className="tour-title" key={active}>
            {feature.title}
            <br />
            <span className="text-primary">{feature.accent}</span>
          </h3>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            {feature.body}
          </p>
          {active === 0 && (
            <div className="presence-preview">
              <p className="text-sm font-semibold">Try a presence preview</p>
              <div
                className="mt-3 flex flex-wrap gap-2"
                aria-label="Simulated presence state"
              >
                {(["present", "away", "break"] as const).map((state) => (
                  <button
                    key={state}
                    aria-pressed={presence === state}
                    onClick={() => setPresence(state)}
                    className="presence-button"
                  >
                    {state === "present"
                      ? "I’m here"
                      : state === "away"
                        ? "Step away"
                        : "Take a break"}
                  </button>
                ))}
              </div>
              <p
                aria-live="polite"
                className="mt-4 flex items-start gap-2 text-sm leading-6 text-primary"
              >
                {presence === "present" ? (
                  <Check className="mt-1 size-4 shrink-0" />
                ) : (
                  <Coffee className="mt-1 size-4 shrink-0" />
                )}
                {presence === "present"
                  ? "You’re present. Your study time counts toward your goal."
                  : presence === "away"
                    ? "You’re away. Time away is tracked separately from time present."
                    : "Take a breath. Break time is tracked separately, and your progress is kept."}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Interactive illustration • No camera access
              </p>
            </div>
          )}
          <p className="mt-6 text-xs leading-6 text-muted-foreground">
            {feature.note}
          </p>
          <div className="mt-auto flex items-center gap-3 pt-8">
            <button
              aria-label="Previous feature"
              onClick={() => select(active - 1)}
              className="tour-arrow"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button onClick={() => select(active + 1)} className="tour-next">
              {active === 4 ? "Back to the beginning" : "Next feature"}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
        <div className="tour-stage" style={{ backgroundColor: feature.color }}>
          <div className="tour-phone">
            {features.map((item, index) => (
              <Image
                key={item.image}
                src={`/marketing/${item.image}.png`}
                alt={item.alt}
                width={1320}
                height={2868}
                sizes="(max-width: 767px) 220px, 250px"
                hidden={index !== active}
                className="h-auto w-full"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
