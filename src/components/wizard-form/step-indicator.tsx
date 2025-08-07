import { cn } from "@/lib/utils";

import { type WizardStep } from ".";

export function StepIndicator<T>({
  steps,
  currentStep,
}: {
  steps: WizardStep<T>[];
  currentStep: number;
}) {
  return (
    <div className="mb-8">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-medium",
                index < currentStep
                  ? "bg-primary text-primary-foreground" // completed
                  : index === currentStep
                    ? "border-2 border-primary text-primary" // current
                    : "border-2 border-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </div>
            <div className="mt-1 w-16 text-center text-xs">{step.title}</div>
          </div>
        ))}
      </div>
      <div className="relative mt-2">
        <div className="absolute top-0 h-1 w-full bg-muted" />
        <div
          className="absolute h-1 bg-primary transition-all"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
