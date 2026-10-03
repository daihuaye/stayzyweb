"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"system" | "dark" | "light">("system");
  const Icon = theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Color theme: ${theme}. Switch to ${theme === "system" ? "dark" : theme === "dark" ? "light" : "system"} mode`}
      onClick={(event) => {
        const next =
          theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
        setTheme(next);
        event.currentTarget
          .closest(".marketing-site")
          ?.setAttribute("data-theme", next);
      }}
    >
      <Icon size={18} strokeWidth={1.8} />
    </button>
  );
}
