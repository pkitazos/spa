import { type ReactNode } from "react";

import { type ClassValue } from "clsx";
import { InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export function MoreInformation({
  className,
  children,
  align = "center",
  side = "right",
}: {
  className?: ClassValue;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Popover>
      <PopoverTrigger>
        <InfoIcon className="h-4 w-4 stroke-slate-400" />
      </PopoverTrigger>
      <PopoverContent align={align} side={side} className={cn(className)}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
