import { type ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export function WithTooltip({
  tip,
  children,
  duration = 250,
  align = "center",
  side = "top",
}: {
  tip: ReactNode;
  children: ReactNode;
  duration?: number;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TooltipProvider delayDuration={duration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent align={align} side={side}>
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
