import { ClassValue } from "clsx";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

export function FormDivider({
  className,
  onClick,
}: {
  className?: ClassValue;
  onClick: () => void;
}) {
  return (
    <div className={cn("relative -my-2", className)}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="bg-background"
          onClick={onClick}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
