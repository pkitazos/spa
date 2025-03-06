import { ReactNode } from "react";
import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

export function PageWrapper({
  className,
  children,
}: {
  className?: ClassValue;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("mt-6 flex h-max w-full flex-col gap-10 pb-20", className)}
    >
      {children}
    </div>
  );
}
