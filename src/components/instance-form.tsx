"use client";
import { ReactNode } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format, setHours, setMinutes, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CalendarIcon, Plus, X } from "lucide-react";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { updateDateOnly } from "@/lib/utils/date/update-date-only";
import {
  buildInstanceFormSchema,
  ValidatedInstanceDetails,
} from "@/lib/validations/instance-form";

import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { NoteCard } from "./ui/note-card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { TimePicker } from "./ui/time-picker";
import { SubHeading } from "./heading";

import { spacesLabels } from "@/content/spaces";

export function InstanceForm({
  submissionButtonLabel,
  takenNames = [],
  currentInstanceDetails,
  isForked = false,
  onSubmit,
  children: dismissalButton,
}: {
  submissionButtonLabel: string;
  takenNames?: string[];
  currentInstanceDetails?: ValidatedInstanceDetails;
  isForked?: boolean;
  onSubmit: (data: ValidatedInstanceDetails) => Promise<void>;
  children: ReactNode;
}) {
  const defaultInstanceDetails = currentInstanceDetails ?? {
    instanceName: "",
    flags: [{ title: "" }],
    tags: [],
    projectSubmissionDeadline: addDays(new Date(), 1),
    minNumPreferences: 1,
    maxNumPreferences: 1,
    maxNumPerSupervisor: 1,
    preferenceSubmissionDeadline: addDays(new Date(), 2),
    interimMarkingDeadline: addDays(new Date(), 3),
    markingSubmissionDeadline: addDays(new Date(), 4),
  };

  const formSchema = buildInstanceFormSchema(takenNames);
  type FormSchemaType = z.infer<typeof formSchema>;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultInstanceDetails,
  });

  const {
    fields: flagFields,
    append: appendFlag,
    remove: removeFlag,
  } = useFieldArray({
    control: form.control,
    name: "flags",
    rules: { minLength: 1 },
  });

  const {
    fields: tagFields,
    append: appendTag,
    remove: removeTag,
  } = useFieldArray({
    control: form.control,
    name: "tags",
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-10 flex flex-col gap-6"
      >
        <div
          className={cn(
            "flex flex-col items-start gap-3",
            currentInstanceDetails && "hidden",
          )}
        >
          <FormField
            control={form.control}
            name="instanceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-2xl">
                  {spacesLabels.instance.full} Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={`${spacesLabels.instance.short} Name`}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Please select a unique name within the{" "}
                  {spacesLabels.group.short} and {spacesLabels.subGroup.short}{" "}
                  for this {spacesLabels.instance.short}.
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
        </div>
        <SubHeading className="text-2xl">Project Details</SubHeading>
        {isForked && (
          <NoteCard>
            You are in a forked {spacesLabels.instance.short}. Any new flags or
            keywords created will be carried over to the parent{" "}
            {spacesLabels.instance.short}, and any deleted flags or keywords
            will remain in the parent {spacesLabels.instance.short} when
            merging.
          </NoteCard>
        )}
        <div className="grid w-full grid-cols-2">
          <div className="flex flex-col gap-2">
            <FormLabel className="text-base">Project Flags</FormLabel>
            <FormDescription>
              Flags are used to mark a project as suitable for a particular
              group of students{" "}
            </FormDescription>
            {flagFields.map((item, idx) => (
              <FormField
                key={item.id}
                control={form.control}
                name="flags"
                render={() => (
                  <FormItem className="w-80">
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Flag"
                          {...form.register(`flags.${idx}.title` as const)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (e.currentTarget.value.trim() !== "") {
                                appendFlag({ title: "" });
                              }
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={flagFields.length === 1}
                          onClick={() => removeFlag(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.flags?.[idx]?.title?.message ?? ""}
                    </p>
                  </FormItem>
                )}
              />
            ))}
            <Button
              className="flex w-80 items-center gap-2"
              variant="outline"
              type="button"
              onClick={() => appendFlag({ title: "" })}
            >
              <Plus />
              <p>Add new Flag</p>
            </Button>
            <FormDescription className="text-black">
              Please note:
              <ul className="list-disc pl-6">
                <li>Flag titles must be unique</li>
                <li>
                  You must enter{" "}
                  <span className="font-semibold underline">at least one</span>{" "}
                  Flag
                </li>
              </ul>
            </FormDescription>
          </div>

          <div className="flex flex-col gap-2">
            <FormLabel className="text-base">Project Keywords</FormLabel>
            <FormDescription>
              A starting selection of keywords Supervisors can use to label
              their projects
            </FormDescription>
            {tagFields.map((item, idx) => (
              <FormField
                key={item.id}
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem className="w-80">
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Keyword"
                          {...form.register(`tags.${idx}.title`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (e.currentTarget.value.trim() !== "") {
                                appendTag({ title: "" });
                              }
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={tagFields.length === 1}
                          onClick={() => removeTag(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.tags?.[idx]?.title?.message ?? ""}
                    </p>
                  </FormItem>
                )}
              />
            ))}
            <Button
              className="flex w-80 items-center gap-2"
              variant="outline"
              type="button"
              onClick={() => appendTag({ title: "" })}
            >
              <Plus />
              <p>Add new Keyword</p>
            </Button>
          </div>
        </div>
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
                      disabled={(date) => date < subDays(new Date(), 1)}
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
        <Separator className="my-14" />
        <SubHeading className="text-2xl">Student Restrictions</SubHeading>
        <div className="grid w-full gap-16 md:grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="minPreferences"
              render={({ field }) => (
                <FormItem className="w-96">
                  <div className="flex items-center justify-between gap-4">
                    <FormLabel className="text-base">
                      Minimum number of Preferences:
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="w-20 text-center placeholder:text-slate-300"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxPreferences"
              render={({ field }) => (
                <FormItem className="w-96">
                  <div className="flex items-center justify-between gap-4">
                    <FormLabel className="text-base">
                      Maximum number of Preferences:
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="w-20 text-center placeholder:text-slate-300"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxPreferencesPerSupervisor"
              render={({ field }) => (
                <FormItem className="w-96">
                  <div className="flex items-center justify-between gap-4">
                    <FormLabel className="text-base">per Supervisor:</FormLabel>
                    <FormControl>
                      <Input
                        className="w-20 text-center placeholder:text-slate-300"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    The maximum number of projects belonging to the same
                    supervisor a student is able to select
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
                        disabled={(date) => date < subDays(new Date(), 1)}
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
        </div>
        <Separator className="my-14" />
        <SubHeading className="text-2xl">Reader Restrictions</SubHeading>
        <div className="grid w-full gap-16 md:grid-cols-1 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="interimMarkingDeadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-base">
                  Interim Marking Submission deadline
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
                        disabled={(date) => date < subDays(new Date(), 1)}
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
                  The deadline for readers to submit their interim markings.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="markingSubmissionDeadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-base">
                  Marking Submission deadline
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
                        disabled={(date) => date < subDays(new Date(), 1)}
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
                  The deadline for readers to submit their markings.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Separator className="my-10" />
        <div className="flex justify-end gap-8">
          {dismissalButton}
          <Button type="submit" size="lg">
            {submissionButtonLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
