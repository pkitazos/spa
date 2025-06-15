import { ReactNode } from "react";
import { ClassValue } from "clsx";

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
        "flex h-max w-full max-w-6xl flex-col gap-4 pb-20",
        className,
      )}
    >
      {children}
    </div>
  );
}
