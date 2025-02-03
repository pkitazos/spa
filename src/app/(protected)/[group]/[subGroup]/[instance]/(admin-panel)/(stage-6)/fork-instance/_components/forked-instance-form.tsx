"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format, setHours, setMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { SubHeading } from "@/components/heading";
import { useInstanceParams } from "@/components/params-context";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { TimePicker } from "@/components/ui/time-picker";

import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { updateDateOnly } from "@/lib/utils/date/update-date-only";
import { formatParamsAsPath } from "@/lib/utils/general/get-instance-path";
import { slugify } from "@/lib/utils/general/slugify";
import {
  buildForkedInstanceSchema,
  ForkedInstanceDetails,
} from "@/lib/validations/instance-form";

import { spacesLabels } from "@/content/spaces";

export function ForkedInstanceForm({
  takenNames,
}: {
  currentInstance: ForkedInstanceDetails;
  takenNames: Set<string>;
}) {
  const params = useInstanceParams();
  const { group, subGroup } = params;
  const router = useRouter();

  const instancePath = formatParamsAsPath(params);

  const form = useForm<ForkedInstanceDetails>({
    resolver: zodResolver(buildForkedInstanceSchema(takenNames)),
    defaultValues: {
      instanceName: "",
      projectSubmissionDeadline: addDays(new Date(), 1),
      preferenceSubmissionDeadline: addDays(new Date(), 2),
    },
  });

  const { mutateAsync: forkAsync } =
    api.institution.instance.fork.useMutation();

  function onSubmit(data: ForkedInstanceDetails) {
    void toast.promise(
      forkAsync({ params, newInstance: data }).then(() => {
        router.push(`/${group}/${subGroup}/${slugify(data.instanceName)}/`);
        router.refresh();
      }),
      {
        loading: `Forking ${spacesLabels.instance.full}...`,
        error: `Failed to fork ${spacesLabels.instance.full}`,
        success: `Successfully forked ${spacesLabels.instance.full}`,
      },
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-10 flex flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="instanceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-2xl">
                New {spacesLabels.instance.full} Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={`${spacesLabels.instance.short} Name`}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Please select a unique name within the{" "}
                {spacesLabels.group.short} and {spacesLabels.subGroup.short} for
                this {spacesLabels.instance.short}.
                <br />
                <p className="pt-1 text-black">
                  Please note: This name{" "}
                  <span className="font-semibold underline">
                    cannot be changed
                  </span>{" "}
                  later.
                </p>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator className="my-14" />
        <SubHeading className="text-2xl">Supervisor Restrictions</SubHeading>
        <FormField
          control={form.control}
          name="projectSubmissionDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-base">
                Project Submission deadline
              </FormLabel>
              <div className="flex items-center justify-start gap-14">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(val) => {
                        if (!val) return;
                        const newDate = updateDateOnly(field.value, val);
                        field.onChange(newDate);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <TimePicker
                  currentTime={field.value}
                  onHourChange={(val) => {
                    const newHour = parseInt(val, 10);
                    const newDate = setHours(field.value, newHour);
                    const zonedDate = toZonedTime(newDate, "Europe/London");
                    field.onChange(zonedDate);
                  }}
                  onMinuteChange={(val) => {
                    const newMinute = parseInt(val, 10);
                    const newDate = setMinutes(field.value, newMinute);
                    const zonedDate = toZonedTime(newDate, "Europe/London");
                    field.onChange(zonedDate);
                  }}
                />
              </div>
              <FormDescription>
                The deadline for supervisors to submit their projects.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator className="my-10" />
        <SubHeading className="text-2xl">Student Restrictions</SubHeading>
        <FormField
          control={form.control}
          name="preferenceSubmissionDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-base">
                Preference Submission deadline
              </FormLabel>
              <div className="flex items-center justify-start gap-14">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(val) => {
                        if (!val) return;
                        const newDate = updateDateOnly(field.value, val);
                        field.onChange(newDate);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <TimePicker
                  currentTime={field.value}
                  onHourChange={(val) => {
                    const newHour = parseInt(val, 10);
                    const newDate = setHours(field.value, newHour);
                    const zonedDate = toZonedTime(newDate, "Europe/London");
                    field.onChange(zonedDate);
                  }}
                  onMinuteChange={(val) => {
                    const newMinute = parseInt(val, 10);
                    const newDate = setMinutes(field.value, newMinute);
                    const zonedDate = toZonedTime(newDate, "Europe/London");
                    field.onChange(zonedDate);
                  }}
                />
              </div>
              <FormDescription>
                The deadline for students to submit their preference list.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator className="my-14" />
        <div className="flex items-center justify-end gap-8">
          <Button variant="outline" size="lg" type="button" asChild>
            <Link href={instancePath}>Cancel</Link>
          </Button>
          <Button size="lg">Fork Instance</Button>
        </div>
      </form>
    </Form>
  );
}
