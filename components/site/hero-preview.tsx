"use client";

import Image from "next/image";
import { useState } from "react";
import { History, SlidersHorizontal, Smile } from "lucide-react";
import { marketingScreens } from "@/lib/marketing-screens";

const previews = [
  {
    label: "Get ready",
    icon: SlidersHorizontal,
    screen: marketingScreens.setup,
  },
  { label: "Stay present", icon: Smile, screen: marketingScreens.focus },
  { label: "Look back", icon: History, screen: marketingScreens.history },
];

export function HeroPreview() {
  const [active, setActive] = useState(0);
  const preview = previews[active];
  return (
    <div className="hero-preview">
      <div className="hero-phones">
        <Image
          {...marketingScreens.details}
          alt={marketingScreens.details.alt}
          sizes="(max-width: 479px) 132px, (max-width: 767px) 188px, (max-width: 1023px) 26vw, 188px"
          className="hero-phone hero-phone-back"
          loading="eager"
        />
        <Image
          key={preview.screen.src}
          {...preview.screen}
          alt={preview.screen.alt}
          sizes="(max-width: 479px) 146px, (max-width: 767px) 208px, (max-width: 1023px) 28vw, 208px"
          loading="eager"
          fetchPriority="high"
          className="hero-phone hero-phone-front"
        />
      </div>
      <div
        className="activity-picker"
        role="group"
        aria-label="Explore app screens"
      >
        {previews.map(({ label, icon: Icon }, index) => (
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
