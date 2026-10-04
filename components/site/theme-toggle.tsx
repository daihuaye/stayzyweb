"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeToggle({
  target = ".marketing-site",
  className = "theme-toggle",
}: {
  target?: string;
  className?: string;
}) {
  const [theme, setTheme] = useState<"system" | "dark" | "light">("system");
  const Icon = theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;
  return (
    <button
      type="button"
      className={className}
      aria-label={`Color theme: ${theme}. Switch to ${theme === "system" ? "dark" : theme === "dark" ? "light" : "system"} mode`}
      onClick={(event) => {
        const next =
          theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
        setTheme(next);
        event.currentTarget.closest(target)?.setAttribute("data-theme", next);
      }}
    >
      <Icon size={18} strokeWidth={1.8} />
    </button>
  );
}
