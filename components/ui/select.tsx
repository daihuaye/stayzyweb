"use client";

import { memo, useId, useState } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
};

export const Select = memo(function Select({
  name,
  label,
  options,
  value,
  defaultValue = "",
  onValueChange,
  disabled = false,
  className,
}: {
  name: string;
  label: string;
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const [localValue, setLocalValue] = useState(defaultValue);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const selected = value ?? localValue;
  const selectedOption = options.find((option) => option.value === selected);
  const Icon = selectedOption?.icon;
  // Empty "all" choices stay empty in FormData, without Radix's reserved empty item value.
  return (
    <>
      <input type="hidden" name={name} value={selected} disabled={disabled} />
      <SelectPrimitive.Root
        value={`option:${selected}`}
        disabled={disabled}
        onValueChange={(next) => {
          const decoded = next.slice("option:".length);
          if (value === undefined) setLocalValue(decoded);
          onValueChange?.(decoded);
        }}
      >
        <SelectPrimitive.Trigger
          ref={setTrigger}
          id={id}
          aria-label={label}
          data-slot="select-trigger"
          className={cn("select-trigger", className)}
        >
          {Icon && (
            <Icon size={16} aria-hidden="true" className="select-value-icon" />
          )}
          <span className="select-value">
            <SelectPrimitive.Value>
              {selectedOption?.label || selected || "Select an option"}
            </SelectPrimitive.Value>
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown size={15} className="select-chevron" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal
          container={
            trigger?.closest<HTMLElement>(".admin-workspace") ?? undefined
          }
        >
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className="select-menu"
          >
            <SelectPrimitive.ScrollUpButton className="select-scroll">
              <ChevronUp size={15} />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="select-viewport">
              <SelectPrimitive.Group>
                <SelectPrimitive.Label className="select-menu-label">
                  {label}
                </SelectPrimitive.Label>
                {options.map(
                  ({
                    value: optionValue,
                    label: optionLabel,
                    description,
                    icon: OptionIcon,
                  }) => (
                    <SelectPrimitive.Item
                      key={optionValue}
                      value={`option:${optionValue}`}
                      textValue={optionLabel}
                      className="select-option"
                    >
                      {OptionIcon && (
                        <OptionIcon
                          size={16}
                          aria-hidden="true"
                          className="select-option-icon"
                        />
                      )}
                      <span className="select-option-copy">
                        <SelectPrimitive.ItemText>
                          {optionLabel}
                        </SelectPrimitive.ItemText>
                        {description && (
                          <span className="select-option-description">
                            {description}
                          </span>
                        )}
                      </span>
                      <SelectPrimitive.ItemIndicator className="select-check">
                        <Check size={16} />
                      </SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>
                  ),
                )}
              </SelectPrimitive.Group>
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="select-scroll">
              <ChevronDown size={15} />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </>
  );
});
