"use client";

import { type ReactNode } from "react";
import { useFormContext } from "react-hook-form";

import { format, isAfter } from "date-fns";
import { z } from "zod";

import { spacesLabels } from "@/config/spaces";

import { DateTimePicker } from "@/components/date-time-picker";
import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { FormWizard, type WizardStep } from "../wizard-form";

import { UploadJsonArea } from "./flag-json-upload";
import TagInput from "./tag-input";
import { TimelineSequence } from "./timeline-sequence";

// TODO these need reset buttons

export const flagsAssessmentSchema = z
  .array(
    z.object({
      flag: z.string(),
      description: z.string(),
      units_of_assessment: z.array(
        z.object({
          title: z.string(),
          student_submission_deadline: z.coerce.date(),
          marker_submission_deadline: z.coerce.date(),
          weight: z.number(),
          allowed_marker_types: z
            .array(
              z.union([z.literal("supervisor"), z.literal("reader")], {
                error: (issue) =>
                  issue.code === "invalid_union"
                    ? "Values must be either supervisor or reader"
                    : (issue.message ?? "freaky error"),
              }),
            )
            .refine((arr) => arr.length === new Set(arr).size, {
              message: "no duplicate values",
            }),
          assessment_criteria: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              weight: z.number(),
            }),
          ),
        }),
      ),
    }),
  )
  .min(1);

function buildWizardSchema(takenNames = new Set<string>()) {
  return z
    .object({
      // basic details
      displayName: z
        .string()
        .min(1, "Please enter a name")
        .refine((name) => !takenNames.has(name), "This name is already taken"),

      // flags and assessment
      flags: flagsAssessmentSchema,

      // project tags
      tags: z
        .array(
          z.object({ title: z.string().min(1, "Please enter a valid title") }),
        )
        .min(1, "You must provide at least one flag"),

      // deadlines
      //deadlines should validate after input
      projectSubmissionDeadline: z.date(
        "Please select a project submission deadline",
      ),

      studentPreferenceSubmissionDeadline: z.date(
        "Please select a student preference submission deadline",
      ),

      readerPreferenceSubmissionDeadline: z.date(
        "Please select a reader preference submission deadline",
      ),

      // student preferences
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

      // reader preferences
      minReaderPreferences: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),

      maxReaderPreferences: z.coerce
        .number("Please enter an integer")
        .int("Number must be an integer")
        .positive(),
    })
    .refine(
      (data) => data.minStudentPreferences <= data.maxStudentPreferences,
      {
        error:
          "Maximum Number of Preferences can't be less than Minimum Number of Preferences",
        path: ["maxStudentPreferences"],
      },
    )
    .refine(
      (data) =>
        data.maxStudentPreferencesPerSupervisor <= data.maxStudentPreferences,
      {
        error:
          "Maximum Number of Preferences per supervisor can't be more than Maximum Number of Preferences",
        path: ["maxStudentPreferencesPerSupervisor"],
      },
    )
    .refine((data) => data.minReaderPreferences <= data.maxReaderPreferences, {
      error:
        "Maximum Number of Preferences can't be less than Minimum Number of Preferences",
      path: ["maxReaderPreferences"],
    })
    .refine(
      (data) => data.minStudentPreferences <= data.maxStudentPreferences,
      {
        error:
          "Maximum Number of Preferences can't be less than Minimum Number of Preferences",

        path: ["maxStudentPreferences"],
      },
    )
    .refine(
      (data) =>
        isAfter(
          data.studentPreferenceSubmissionDeadline,
          data.projectSubmissionDeadline,
        ),
      {
        error:
          "Student Preference Submission deadline must be after Project Upload deadline",
        path: ["studentPreferenceSubmissionDeadline"],
      },
    )
    .refine(
      (data) =>
        isAfter(
          data.readerPreferenceSubmissionDeadline,
          data.studentPreferenceSubmissionDeadline,
        ),
      {
        error:
          "Reader Preference Submission deadline must be after Student Preference Submission deadline",
        path: ["readerPreferenceSubmissionDeadline"],
      },
    );
}

export type WizardFormData = z.infer<ReturnType<typeof buildWizardSchema>>;

interface WizardPageProps {
  children: ReactNode;
  title: string;
  description?: string;
}

function WizardPage({ children, title, description }: WizardPageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <Separator />
      <div className="py-4">{children}</div>
    </div>
  );
}

function BasicDetailsPage() {
  const { control } = useFormContext<WizardFormData>();

  return (
    <WizardPage
      title="Basic Details"
      description="Enter the basic information for your allocation instance."
    >
      <div className="max-w-2xl space-y-6">
        <FormField
          control={control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xl">
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
      </div>
    </WizardPage>
  );
}

function FlagsAssessmentPage() {
  /**
   * TODO hook up visual component (i.e. re-write with form control)
   * need to create a bridge between the store and form
   * can add an effect that syncs data between them ?
   *
   * - should initialise state using the current form values
   * - need a way to update the form when the marking scheme changes
   * - "New Flag" button should add flags to both the Zustand store and the form
   * - flag deletion must update both states
   *
   */
  return (
    <WizardPage
      title="Flags & Assessment Configuration"
      description="Configure flags to categorize students and define assessments for each flag."
    >
      <UploadJsonArea />
    </WizardPage>
  );
}

function ProjectTagsPage() {
  return (
    <WizardPage
      title="Project Keywords"
      description="Define tags that supervisors can use to label their projects."
    >
      <div className="max-w-2xl space-y-6">
        <TagInput
          label="Project Keywords"
          description="Add keywords that supervisors can use to categorise their projects. These help students find relevant projects."
          placeholder="Add a keyword and press Enter"
        />

        <div className="mt-6 rounded-md bg-muted p-4">
          <h3 className="mb-2 text-base font-medium">About Project Keywords</h3>
          <p className="text-sm text-muted-foreground">
            Keywords help organize and categorise projects. They make it easier
            for students to search and filter projects based on their interests
            and skills.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Add common technology keywords (e.g., &quot;Machine
              Learning&quot;, &quot;Web Development&quot;)
            </li>
            <li>Include research areas relevant to your department</li>
            <li>Include subjects students may have taken</li>
            <li>
              Consider including programming languages relevant to the project
              (e.g., &quot;Rust&quot;, &quot;Python&quot;, &quot;Haskell&quot;)
            </li>
          </ul>
        </div>
      </div>
    </WizardPage>
  );
}

function DeadlinesPage() {
  const { control } = useFormContext<WizardFormData>();

  return (
    <WizardPage
      title="Deadlines & Timeline"
      description="Set the important deadlines for your allocation instance."
    >
      <div className="flex max-w-2xl flex-col gap-8">
        <FormField
          control={control}
          name="projectSubmissionDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2 text-base">
                Project Submission Deadline
              </FormLabel>

              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select project submission deadline"
                  label=""
                />
              </FormControl>

              <FormDescription className="mt-1">
                The deadline for supervisors to submit their projects.
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="studentPreferenceSubmissionDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2 text-base">
                Student Preference Submission Deadline
              </FormLabel>

              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select student preference deadline"
                  label=""
                />
              </FormControl>

              <FormDescription className="mt-1">
                The deadline for students to submit their preference list. This
                must be after the project submission deadline.
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="readerPreferenceSubmissionDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2 text-base">
                Reader Preference Submission Deadline
              </FormLabel>

              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select reader preference deadline"
                  label=""
                />
              </FormControl>

              <FormDescription className="mt-1">
                The deadline for readers to submit their preference list. This
                must be after the student preference submission deadline.
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />
        <TimelineSequence />
      </div>
    </WizardPage>
  );
}

function StudentPreferencesPage() {
  const { control } = useFormContext<WizardFormData>();

  return (
    <WizardPage
      title="Student Preferences"
      description="Configure settings for student project preferences."
    >
      <div className="flex max-w-2xl flex-col gap-6">
        <FormField
          control={control}
          name="minStudentPreferences"
          render={({ field }) => (
            <FormItem className="w-full">
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
              <FormDescription>
                The minimum number of preferences a student must submit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="maxStudentPreferences"
          render={({ field }) => (
            <FormItem className="w-full">
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
              <FormDescription>
                The maximum number of preferences a student can submit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="maxStudentPreferencesPerSupervisor"
          render={({ field }) => (
            <FormItem className="w-full">
              <div className="flex items-center justify-between gap-4">
                <FormLabel className="text-base">
                  Maximum Preferences per Supervisor:
                </FormLabel>
                <FormControl>
                  <Input
                    className="w-20 text-center placeholder:text-slate-300"
                    placeholder="1"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormDescription>
                The maximum number of projects belonging to the same supervisor
                a student is able to select.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </WizardPage>
  );
}

function ReaderPreferencesPage() {
  const { control } = useFormContext<WizardFormData>();

  return (
    <WizardPage
      title="Reader Preferences"
      description="Configure settings for reader project preferences."
    >
      <div className="flex max-w-2xl flex-col gap-6">
        <FormField
          control={control}
          name="minReaderPreferences"
          render={({ field }) => (
            <FormItem className="w-full">
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
              <FormDescription>
                The minimum number of preferences a reader must submit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="maxReaderPreferences"
          render={({ field }) => (
            <FormItem className="w-full">
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
              <FormDescription>
                The maximum number of preferences a reader can submit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </WizardPage>
  );
}

function ReviewPage() {
  const form = useFormContext<WizardFormData>();
  const formData = form.getValues();
  return (
    <WizardPage
      title="Review & Submit"
      description="Review your settings and create your allocation instance."
    >
      <div className="flex flex-col items-start justify-start gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Display Name</p>
          <p>{formData.displayName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Flags</p>
          <p>
            {formData.flags.map((f) => (
              <div key={f.flag}>
                <p className="font-semibold">{f.flag}</p>
                <p>{f.description}</p>
                <div>
                  {f.units_of_assessment.map((u) => (
                    <div key={`${f.flag}-${u.title}`} className="pl-6">
                      <p className="font-semibold">{u.title}</p>
                      <p>weight: {u.weight}</p>
                      <p>
                        allowed marker types:{" "}
                        {u.allowed_marker_types.join(", ")}
                      </p>
                      <p>
                        <span>Student Submission Deadline: </span>
                        {format(
                          u.student_submission_deadline,
                          "dd MMM yyyy - HH:mm",
                        )}
                      </p>
                      <p>
                        <span>Marker Submission Deadline: </span>
                        {format(
                          u.marker_submission_deadline,
                          "dd MMM yyyy - HH:mm",
                        )}
                      </p>
                      <div className="pl-6">
                        {u.assessment_criteria.map((c) => (
                          <div
                            className="pl-6"
                            key={`${f.flag}-${u.title}-${c.title}`}
                          >
                            <p className="font-semibold">{c.title}</p>
                            <p>{c.description}</p>
                            <p>{c.weight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tags</p>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((t, i) => (
              <Badge variant="accent" key={i}>
                {t.title}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Deadlines</p>
          <p>
            Project Submission:
            {format(formData.projectSubmissionDeadline, "dd MMM yyyy - HH:mm")}
          </p>
          <p>
            Student Preference Submission:
            {format(
              formData.studentPreferenceSubmissionDeadline,
              "dd MMM yyyy - HH:mm ",
            )}
          </p>
          <p>
            Reader Preference Submission:
            {format(
              formData.readerPreferenceSubmissionDeadline,
              "dd MMM yyyy - HH:mm ",
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Student Preference Restrictions
          </p>
          <p>min: {formData.minStudentPreferences}</p>
          <p>max: {formData.maxStudentPreferences}</p>
          <p>
            max per supervisor: {formData.maxStudentPreferencesPerSupervisor}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Reader Preference Restrictions
          </p>
          <p>min: {formData.minReaderPreferences}</p>
          <p>max: {formData.maxReaderPreferences}</p>
        </div>
      </div>
    </WizardPage>
  );
}

export const WIZARD_STEPS: WizardStep<WizardFormData>[] = [
  {
    id: "basic-details",
    title: "Basic Details",
    fieldsToValidate: ["displayName"],
    render: () => <BasicDetailsPage />,
  },
  {
    id: "flags-assessment",
    title: "Flags & Assessments",
    fieldsToValidate: ["flags"],
    render: () => <FlagsAssessmentPage />,
  },
  {
    id: "project-tags",
    title: "Project Keywords",
    fieldsToValidate: ["tags"],
    render: () => <ProjectTagsPage />,
  },
  {
    id: "deadlines",
    title: "Deadlines & Timeline",
    fieldsToValidate: [
      "projectSubmissionDeadline",
      "studentPreferenceSubmissionDeadline",
      "readerPreferenceSubmissionDeadline",
    ],
    render: () => <DeadlinesPage />,
  },
  {
    id: "student-preferences",
    title: "Student Preferences",
    fieldsToValidate: [
      "minStudentPreferences",
      "maxStudentPreferences",
      "maxStudentPreferencesPerSupervisor",
    ],
    render: () => <StudentPreferencesPage />,
  },
  {
    id: "reader-preferences",
    title: "Reader Preferences",
    fieldsToValidate: ["minReaderPreferences", "maxReaderPreferences"],
    render: () => <ReaderPreferencesPage />,
  },
  {
    id: "review",
    title: "Review & Submit",
    fieldsToValidate: [],
    render: () => <ReviewPage />,
  },
];

export function InstanceWizard({
  onSubmit,
  defaultValues,
  takenNames = new Set(),
}: {
  onSubmit: (data: WizardFormData) => Promise<void>;
  defaultValues: WizardFormData;
  takenNames: Set<string>;
}) {
  const wizardSchema = buildWizardSchema(takenNames);

  return (
    <FormWizard
      onSubmit={onSubmit}
      steps={WIZARD_STEPS}
      defaultValues={defaultValues}
      schema={wizardSchema}
    />
  );
}
