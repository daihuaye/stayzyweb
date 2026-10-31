"use client";

import Image from "next/image";
import { marketingScreens } from "@/lib/marketing-screens";
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
    body: "See confirmed presence as you work. In Piano Practice, detected playing can also count toward your focus goal.",
    note: "Keep Stayzy open. Detected piano playing can also count toward a Piano Practice goal.",
    screen: marketingScreens.focus,
    color: "var(--stage-rose)",
  },
  {
    label: "See your time",
    icon: Timer,
    title: "Understand the time",
    accent: "behind your progress.",
    body: "Open a saved session for a clearer breakdown of time present, time away, breaks, and moments when presence could not be confirmed.",
    note: "Time present measures detected presence, not attention or work quality.",
    screen: marketingScreens.details,
    color: "var(--stage-teal)",
  },
  {
    label: "Build your rhythm",
    icon: CalendarDays,
    title: "Small moments.",
    accent: "A bigger picture.",
    body: "Move from your week to the full month. Progress rings show your sessions, and stars mark days with a goal achieved.",
    note: "A star marks a day with at least one goal achieved.",
    screen: marketingScreens.calendar,
    color: "var(--stage-neutral)",
  },
  {
    label: "Meet your companion",
    icon: Smile,
    title: "A little company.",
    accent: "Room to focus.",
    body: "Let your companion take the screen for a calmer study space. Your session details are a tap away whenever you need them.",
    note: "Tap to switch between your companion and session details.",
    screen: marketingScreens.companion,
    color: "var(--stage-rose)",
  },
  {
    label: "Look back",
    icon: History,
    title: "Your effort,",
    accent: "all in one place.",
    body: "Choose a day to see its focus time, sessions, and goals. Open a saved session whenever you want the details.",
    note: "Your profiles and session history stay on your device.",
    screen: marketingScreens.history,
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
    const selectedTab = tabs.current[next];
    const tabList = selectedTab?.parentElement;
    // Keep the active feature visible on narrow screens without moving the page.
    if (selectedTab && tabList && tabList.scrollWidth > tabList.clientWidth) {
      const selectedBounds = selectedTab.getBoundingClientRect();
      const listBounds = tabList.getBoundingClientRect();
      tabList.scrollTo({
        left:
          tabList.scrollLeft +
          selectedBounds.left -
          listBounds.left -
          (tabList.clientWidth - selectedBounds.width) / 2,
        behavior: "instant",
      });
    }
    if (focus) {
      selectedTab?.focus();
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
        className={`tour-panel${active === 2 ? " tour-panel-calendar" : ""}`}
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
                Interactive illustration. No camera access.
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
          <div className={`tour-phone${active === 2 ? " tour-tablet" : ""}`}>
            {features.map((item, index) => (
              <Image
                key={item.screen.src}
                {...item.screen}
                alt={item.screen.alt}
                sizes={
                  index === 2
                    ? "(max-width: 767px) calc(100vw - 90px), (max-width: 1023px) 480px, 340px"
                    : "(max-width: 767px) 220px, 250px"
                }
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
