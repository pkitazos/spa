"use client";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { CurrentMarks, UpdatedMarks } from "@/lib/validations/marking-form";

import { Input } from "./ui/input";
import layoutData from "./layout.json"; // Import the JSON file

export function MarkingForm({
  submissionButtonLabel,
  project,
  onSubmit,
}: {
  submissionButtonLabel: string;
  onSubmit: (data: UpdatedMarks) => void;
  project: CurrentMarks;
}) {
  const form = useForm({
    defaultValues: {
      marks: project?.marks ?? [],
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-10 flex w-full max-w-5xl flex-col gap-6"
      >
        {layoutData.layout.map((field) => (
          <FormField
            key={field.id}
            control={form.control}
            name={`marks.${field.id - 1}`}
            render={({ field: formField }) => (
              <FormItem>
                <label htmlFor={`mark-${field.id}`}>{field.name}</label>
                <FormControl>
                  <Input
                    id={`mark-${field.id}`}
                    type="number"
                    value={formField.value}
                    onChange={formField.onChange}
                  />
                </FormControl>
                <FormDescription>
                  {field.description} [{field.weight}]
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <div className="mt-16 flex justify-end gap-8">
          <Button variant="outline" size="lg">
            Save
          </Button>
          <Button type="submit" size="lg">
            {submissionButtonLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
