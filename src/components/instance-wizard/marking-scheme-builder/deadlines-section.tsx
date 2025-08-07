import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarISOWeeks } from "date-fns";
import { z } from "zod";

import { DateTimePicker } from "@/components/date-time-picker";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const deadlinesSchema = z
  .object({
    studentSubmissionDeadline: z.date(),
    markerSubmissionDeadline: z.date(),
  })
  .refine(
    (data) =>
      differenceInCalendarISOWeeks(
        data.studentSubmissionDeadline,
        data.markerSubmissionDeadline,
      ) >= 3,
  );

type DeadlinesSchema = z.infer<typeof deadlinesSchema>;

export function DeadlinesSection({
  defaultDates,
}: {
  defaultDates: DeadlinesSchema;
}) {
  const form = useForm<DeadlinesSchema>({
    resolver: zodResolver(deadlinesSchema),
    defaultValues: {
      studentSubmissionDeadline: defaultDates.studentSubmissionDeadline,
      markerSubmissionDeadline: defaultDates.markerSubmissionDeadline,
    },
  });

  function onSubmit(data: DeadlinesSchema) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className=" flex flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="studentSubmissionDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2 text-base">
                Student Submission deadline
              </FormLabel>
              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  label=""
                />
              </FormControl>
              <FormDescription className="mt-1">
                The deadline for students to submit their deliverable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="markerSubmissionDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2 text-base">
                Marker Submission deadline
              </FormLabel>
              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  label=""
                />
              </FormControl>
              <FormDescription className="mt-1">
                The deadline for markers to submit their grades.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
