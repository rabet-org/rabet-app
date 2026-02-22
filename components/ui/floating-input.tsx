"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, icon, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value !== "");
    };

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "peer w-full rounded-md border border-input bg-background px-3 py-3 text-sm transition-all",
            "placeholder-transparent",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-10",
            className,
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={label}
          {...props}
        />
        <label
          className={cn(
            "absolute left-3 transition-all duration-200 pointer-events-none",
            "text-muted-foreground",
            icon && "left-10",
            "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm",
            "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-background peer-focus:px-1",
            (isFocused || hasValue || props.value) &&
              "top-0 -translate-y-1/2 text-xs bg-background px-1 text-primary",
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);

FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
