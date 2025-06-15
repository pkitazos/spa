import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TaskCompletionCardProps {
  title: string;
  completed: number;
  total: number;
  className?: string;
  showProgress?: boolean;
}

export function TaskCompletionCard({
  title,
  completed,
  total,
  className,
  showProgress = true,
}: TaskCompletionCardProps) {
  const isDisabled = total <= 0;
  const isComplete = completed >= total;
  const isIncomplete = completed < total && total > 0;

  return (
    <Card className={cn("flex w-full justify-between px-10 py-5", className)}>
      <h2
        className={cn(
          "text-lg font-medium",
          isDisabled && "text-muted-foreground",
        )}
      >
        {title}
      </h2>
      {showProgress && total > 0 && (
        <p
          className={cn(
            "text-lg font-medium",
            isIncomplete && "text-destructive",
            isComplete && "text-green-500",
          )}
        >
          {completed} / {total}
        </p>
      )}
    </Card>
  );
}
