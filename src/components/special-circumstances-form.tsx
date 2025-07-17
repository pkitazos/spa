"use client";

import { useForm } from "react-hook-form";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import {
  type CurrentSpecialCircumstances,
  type specialCircumstances,
  type UpdatedSpecialCircumstances,
} from "@/lib/validations/special-circumstances-form";

import { useInstancePath } from "./params-context";

export function SpecialCircumstancesForm({
  submissionButtonLabel,
  project,
  onSubmit,
}: {
  specialCircumstances: specialCircumstances;
  submissionButtonLabel: string;
  onSubmit: (data: UpdatedSpecialCircumstances) => void;
  project: CurrentSpecialCircumstances;
}) {
  const instancePath = useInstancePath();

  const formProject = {
    specialCircumstances: project?.specialCircumstances ?? "",
  };

  const form = useForm<specialCircumstances>({
    defaultValues: { specialCircumstances: formProject.specialCircumstances },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-10 flex w-full max-w-5xl flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="specialCircumstances"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Detail any special or extenuating circumstances to the project here."
                />
              </FormControl>
              <FormDescription>
                Special circumstances that may affect the project.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="mt-16 flex justify-end gap-8">
          {project && (
            <Button type="button" size="lg" variant="outline" asChild>
              <Link
                className="w-32"
                href={`${instancePath}/projects/${project.id}`}
              >
                Cancel
              </Link>
            </Button>
          )}
          <Button type="submit" size="lg">
            {submissionButtonLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
