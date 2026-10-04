"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Music2, Pencil } from "lucide-react";

const activities = [
  {
    label: "Reading",
    icon: BookOpen,
    image: "reading-focus",
    alt: "Stayzy reading session with the orange Sunny companion and present, away, break, and elapsed time counters",
  },
  {
    label: "Homework",
    icon: Pencil,
    image: "homework-focus",
    alt: "Stayzy homework session with the purple Pebble companion and present, away, break, and elapsed time counters",
  },
  {
    label: "Piano practice",
    icon: Music2,
    image: "piano-focus",
    alt: "Stayzy piano practice session with presence and piano time counters",
  },
];

const autoplayDuration = 4000;

export function HeroPreview() {
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const progressFill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let progressAnimation: Animation | undefined;

    function scheduleNext() {
      clearTimeout(timer);
      progressAnimation?.cancel();
      if (isHovered || hasFocus || document.hidden || reducedMotion.matches) {
        return;
      }
      progressAnimation = progressFill.current?.animate(
        [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
        { duration: autoplayDuration, easing: "linear", fill: "forwards" },
      );
      timer = setTimeout(() => {
        setActive((current) => (current + 1) % activities.length);
      }, autoplayDuration);
    }

    scheduleNext();
    document.addEventListener("visibilitychange", scheduleNext);
    reducedMotion.addEventListener("change", scheduleNext);
    return () => {
      clearTimeout(timer);
      progressAnimation?.cancel();
      document.removeEventListener("visibilitychange", scheduleNext);
      reducedMotion.removeEventListener("change", scheduleNext);
    };
  }, [active, isHovered, hasFocus]);

  const activity = activities[active];
  return (
    <div
      className="hero-preview"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHasFocus(false);
        }
      }}
    >
      <div className="hero-phones" aria-live="off">
        <Image
          src="/marketing/piano-report.png"
          alt="Live report of a piano session, showing present time, breaks, and goal progress"
          width={1320}
          height={2868}
          sizes="(max-width: 767px) 38vw, (max-width: 1023px) 26vw, 210px"
          className="hero-phone hero-phone-back"
        />
        <Image
          key={activity.image}
          src={`/marketing/${activity.image}.png`}
          alt={activity.alt}
          width={1320}
          height={2868}
          sizes="(max-width: 479px) 146px, (max-width: 767px) 208px, (max-width: 1023px) 28vw, 208px"
          loading="eager"
          fetchPriority="high"
          className="hero-phone hero-phone-front"
        />
      </div>
      <div className="activity-picker" aria-label="Explore activities">
        {activities.map(({ label, icon: Icon }, index) => (
          <button
            type="button"
            key={label}
            aria-pressed={active === index}
            onClick={() => setActive(index)}
          >
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>
      <div className="activity-progress" aria-hidden="true">
        <span ref={progressFill} className="activity-progress-fill" />
      </div>
    </div>
  );
}
