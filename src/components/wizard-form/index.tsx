// TODO: jump through typescript hoops
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState } from "react";
import { FormProvider, type Path, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { type z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

import { StepIndicator } from "./step-indicator";

export type WizardStep<T> = {
  id: string;
  title: string;
  fieldsToValidate: Path<T>[];
  render: React.FC;
};

export function FormWizard<
  TSchema extends z.ZodType<unknown>,
  TOut extends z.output<TSchema>,
>({
  onSubmit,
  steps,
  defaultValues,
  schema,
}: {
  onSubmit: (data: TOut) => Promise<void>;
  steps: WizardStep<TOut>[];
  defaultValues: TOut;
  schema: TSchema;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm({ resolver: zodResolver(schema), defaultValues });

  async function handleNext() {
    if (currentStep === steps.length - 1) {
      await form.trigger();
      await form.handleSubmit(onSubmit)();
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
