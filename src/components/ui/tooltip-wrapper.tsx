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
  forDisabled = false,
}: {
  tip: ReactNode;
  children: ReactNode;
  duration?: number;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  forDisabled?: boolean;
}) {
  const triggerContent = forDisabled ? (
    <div className="w-full">{children}</div>
  ) : (
    children
  );

  return (
    <TooltipProvider delayDuration={duration}>
      <Tooltip>
        <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
        <TooltipContent align={align} side={side}>
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
