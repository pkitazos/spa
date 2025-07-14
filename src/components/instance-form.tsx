"use client";
import { ReactNode } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDays,
  addMonths,
  format,
  getHours,
  getMinutes,
  isAfter,
  set,
  setHours,
  setMinutes,
  subDays,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CalendarIcon, Plus, X } from "lucide-react";
import { z } from "zod";

import { cn } from "@/lib/utils";

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

import { spacesLabels } from "@/config/spaces";
import { FlagDTO, InstanceDTO, TagDTO } from "@/dto";

const baseSchema = z.object({
  displayName: z.string().min(1, "Please enter a name"),
  minStudentPreferences: z.number(),
  maxStudentPreferences: z.number(),
  maxStudentPreferencesPerSupervisor: z.number(),
  studentPreferenceSubmissionDeadline: z.date(),
  minReaderPreferences: z.number(),
  maxReaderPreferences: z.number(),
  readerPreferenceSubmissionDeadline: z.date(),
  projectSubmissionDeadline: z.date(),
  flags: z.array(
    z.object({
      title: z.string().min(3, "Please enter a valid title"),
      description: z.string().min(3, "Please enter a valid description"),
    }),
  ),
  tags: z.array(
    z.object({ title: z.string().min(2, "Please enter a valid title") }),
  ),
});

export type ValidatedInstanceDetails = z.infer<typeof baseSchema>;

export function buildInstanceFormSchema(takenNames: Set<string>) {
  return baseSchema
    .omit({
      minStudentPreferences: true,
      maxStudentPreferences: true,
      maxStudentPreferencesPerSupervisor: true,
      minReaderPreferences: true,
      maxReaderPreferences: true,
    })
    .extend({
      minStudentPreferences: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
      maxStudentPreferences: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
      maxStudentPreferencesPerSupervisor: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
      minReaderPreferences: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
      maxReaderPreferences: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
    })
    .refine(({ flags }) => flags.length > 0, {
      error: "Please add at least one flag",
      path: ["flags.0.title"],
    })
    .refine(({ displayName }) => !takenNames.has(displayName), {
      error: "This name is already taken",
      path: ["displayName"],
    })
    .refine((x) => x.minStudentPreferences <= x.maxStudentPreferences, {
      error:
        "Maximum Number of Preferences can't be less than Minimum Number of Preferences",
      path: ["maxStudentPreferences"],
    })
    .refine(
      (x) => x.maxStudentPreferencesPerSupervisor <= x.maxStudentPreferences,
      {
        error:
          "Maximum Number of Preferences per supervisor can't be more than Maximum Number of Preferences",
        path: ["maxStudentPreferencesPerSupervisor"],
      },
    )
    .refine(
      (x) =>
        isAfter(
          x.studentPreferenceSubmissionDeadline,
          x.projectSubmissionDeadline,
        ),
      {
        error:
          "Student Preference Submission deadline can't be before Project Upload deadline",
        path: ["studentPreferenceSubmissionDeadline"],
      },
    )
    .refine((x) => x.minReaderPreferences <= x.maxReaderPreferences, {
      error:
        "Maximum Number of Preferences can't be less than Minimum Number of Preferences",
      path: ["maxReaderPreferences"],
    })
    .refine(
      (x) =>
        isAfter(
          x.readerPreferenceSubmissionDeadline,
          x.studentPreferenceSubmissionDeadline,
        ),
      {
        error:
          "Reader Preference Submission deadline can't be before Student Preference Submission deadline",
        path: ["readerPreferenceSubmissionDeadline"],
      },
    )
    .refine(
      ({ flags }) => {
        const flagSet = new Set(flags.map(({ title }) => title));
        return flags.length === flagSet.size;
      },
      { error: "Flags must have distinct values", path: ["flags.0.title"] },
    );
}

export function InstanceForm({
  submissionButtonLabel,
  takenNames = new Set(),
  formDetails,
  isForked = false,
  onSubmit,
  children: dismissalButton,
}: {
  submissionButtonLabel: string;
  takenNames?: Set<string>;
  formDetails?: { instanceData: InstanceDTO; flags: FlagDTO[]; tags: TagDTO[] };
  isForked?: boolean;
  onSubmit: (data: ValidatedInstanceDetails) => Promise<void>;
  children: ReactNode;
}) {
  const defaultInstanceDetails = formDetails ?? {
    displayName: "",
    projectSubmissionDeadline: addDays(new Date(), 1),
    minStudentPreferences: 1,
    maxStudentPreferences: 1,
    maxStudentPerSupervisor: 1,
    studentPreferenceSubmissionDeadline: addDays(new Date(), 2),
    minReaderPreferences: 1,
    maxReaderPreferences: 1,
    readerPreferenceSubmissionDeadline: addMonths(new Date(), 1),
    flags: [{ title: "", description: "" }],
    tags: [],
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
  } = useFieldArray({ control: form.control, name: "tags" });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-10 flex flex-col gap-6"
      >
        <div
          className={cn(
            "flex flex-col items-start gap-3",
            formDetails && "hidden",
          )}
        >
          <FormField
            control={form.control}
            name="displayName"
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
                                appendFlag({ title: "", description: "" });
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
              onClick={() => appendFlag({ title: "", description: "" })}
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
              name="minStudentPreferences"
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
              name="maxStudentPreferences"
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
              name="maxStudentPreferencesPerSupervisor"
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
            name="studentPreferenceSubmissionDeadline"
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
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="minReaderPreferences"
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
              name="maxReaderPreferences"
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
          </div>
          <FormField
            control={form.control}
            name="studentPreferenceSubmissionDeadline"
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

export function updateDateOnly(oldDate: Date, newDate: Date) {
  const hours = getHours(oldDate);
  const minutes = getMinutes(oldDate);
  return set(newDate, { hours, minutes });
}
