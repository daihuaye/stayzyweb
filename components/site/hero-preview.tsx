"use client";

import Image from "next/image";
import { useState } from "react";
import { BookOpen, Music2, Pencil } from "lucide-react";

const activities = [
  {
    label: "Reading",
    icon: BookOpen,
    image: "setup",
    alt: "Stayzy setup with reading selected, companions, and session length options",
  },
  {
    label: "Homework",
    icon: Pencil,
    image: "heart-companion",
    alt: "The smiling heart companion in Stayzy’s full-screen focus view",
  },
  {
    label: "Piano practice",
    icon: Music2,
    image: "piano-focus",
    alt: "Stayzy piano practice session with presence and piano time counters",
  },
];

export function HeroPreview() {
  const [active, setActive] = useState(2);
  const activity = activities[active];
  return (
    <div className="hero-preview">
      <div className="hero-phones" aria-live="polite">
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
    </div>
  );
}
