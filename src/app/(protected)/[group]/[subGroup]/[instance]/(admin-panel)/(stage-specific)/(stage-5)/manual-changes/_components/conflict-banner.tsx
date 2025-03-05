import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { cn } from "@/lib/utils";

type ConflictType = {
  type: "supervisor" | "project";
  children: ReactNode;
};

export function ConflictBanner({ type, children: message }: ConflictType) {
  const title = type === "project" ? "Project Conflict" : "Supervisor Conflict";

  return (
    <Alert
      variant={"destructive"}
      className={cn(
        "border-2",
        type === "project"
          ? "bg-destructive/10"
          : "border-orange-500/50 bg-orange-500/10 text-orange-600 [&>svg]:text-orange-600",
      )}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="text-lg">{title}</AlertTitle>
      <AlertDescription className="text-base">{message}</AlertDescription>
    </Alert>
  );
}
