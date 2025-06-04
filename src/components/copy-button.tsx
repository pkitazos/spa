import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { copyToClipboard } from "@/lib/utils/general/copy-to-clipboard";
import { ClassValue } from "clsx";
import { CopyIcon } from "lucide-react";
import { Tooltip } from "@radix-ui/react-tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

// pin - check styling @pkitazos
export function CopyButton({
  data,
  message,
  className,
  disabled = false,
}: {
  data: string;
  message?: string;
  className?: ClassValue;
  unstyled?: boolean;
  disabled?: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            className={cn(className, "h-6 w-6 px-0")}
            disabled={disabled}
            variant="outline"
            size="sm"
            onClick={async () => await copyToClipboard(data, message)}
          >
            <CopyIcon className="h-2 w-2" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy {message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
