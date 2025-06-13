import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { FormProvider, Path, useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./step-indicator";
import Link from "next/link";

export type WizardStep<T> = {
  id: string;
  title: string;
  fieldsToValidate: Path<T>[];
  render: React.FC<{}>;
};

export function FormWizard<T extends z.ZodTypeAny>({
  onSubmit,
  steps,
  defaultValues,
  schema,
}: {
  onSubmit: (data: z.infer<T>) => Promise<void>;
  steps: WizardStep<z.infer<T>>[];
  defaultValues: z.infer<T>;
  schema: T;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function handleNext() {
    if (currentStep === steps.length - 1) {
      await form.trigger();
      form.handleSubmit(onSubmit)();
      return;
    }

    const fieldsToValidate = steps[currentStep].fieldsToValidate;

    await form.trigger(fieldsToValidate);

    const valid = fieldsToValidate.every(
      (val) => !form.getFieldState(val).invalid,
    );

    if (valid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }

  function handlePrevious() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  const CurrentStepContents = steps[currentStep].render;

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="w-full pt-6">
            <CardContent>
              <StepIndicator steps={steps} currentStep={currentStep} />
              <CurrentStepContents />
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    tabIndex={1}
                  >
                    Previous
                  </Button>
                )}
                {currentStep === 0 && (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    tabIndex={1}
                    asChild
                  >
                    <Link href="./settings">Cancel</Link>
                  </Button>
                )}
              </div>
              <Button type="button" onClick={handleNext} tabIndex={0}>
                {currentStep === steps.length - 1 ? "Submit" : "Next"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </FormProvider>
  );
}
