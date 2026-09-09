"use client";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
export function PasswordField({
  name,
  label,
  autoComplete = "new-password",
  disabled = false,
  help,
}: {
  name: string;
  label: string;
  autoComplete?: "new-password" | "current-password";
  disabled?: boolean;
  help?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className="pr-12"
          disabled={disabled}
          aria-describedby={help ? `${id}-help` : undefined}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-xl text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {help && (
        <p
          id={`${id}-help`}
          className="mt-2 text-xs leading-5 text-muted-foreground"
        >
          {help}
        </p>
      )}
    </div>
  );
}
