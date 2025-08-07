import { type ReactNode } from "react";

import { type ClassValue } from "clsx";

import { cn } from "@/lib/utils";

export function PanelWrapper({
  className,
  children,
}: {
  className?: ClassValue;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-max w-full mx-auto max-w-6xl flex-col gap-4 pb-20",
        className,
      )}
    >
      {children}
    </div>
  );
}
