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
  disabled = false,
}: {
  tip: ReactNode;
  children: ReactNode;
  duration?: number;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  forDisabled?: boolean;
  disabled?: boolean;
}) {
  const triggerContent = forDisabled ? <div>{children}</div> : children;

  return (
    <TooltipProvider
      delayDuration={duration}
      disableHoverableContent={disabled}
    >
      <Tooltip>
        <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
        <TooltipContent align={align} side={side}>
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
